import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Create a TEXT analysis (image analyses go through imageAnalysis.ts)
// ─────────────────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    type: v.union(v.literal("text"), v.literal("image")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.type === "image") {
      throw new ConvexError(
        "Image analyses must be submitted via analyzeImageFeatures with a feature vector."
      );
    }

    if (!args.content.trim()) {
      throw new ConvexError("Please provide text content to analyse.");
    }

    const analysisId = await ctx.db.insert("analyses", {
      type: "text",
      content: args.content,
      result: "Pending",
      confidence: 0,
      timestamp: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.analyses.runTextPrediction, {
      analysisId,
      content: args.content,
    });

    return analysisId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Run text prediction using TF-IDF + Logistic Regression
// ─────────────────────────────────────────────────────────────────────────────

export const runTextPrediction = internalAction({
  args: {
    analysisId: v.id("analyses"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const latestModel = await ctx.runQuery(internal.analyses.getLatestReadyModel);

      if (!latestModel || !latestModel.modelFileId || !latestModel.vectorizerFileId) {
        await ctx.runMutation(internal.analyses.failAnalysis, {
          analysisId: args.analysisId,
          reason: "No trained text model found. Please train a model first.",
        });
        return;
      }

      const [modelUrl, vectorizerUrl] = await Promise.all([
        ctx.runQuery(internal.analyses.getStorageUrl, { fileId: latestModel.modelFileId }),
        ctx.runQuery(internal.analyses.getStorageUrl, { fileId: latestModel.vectorizerFileId }),
      ]);

      if (!modelUrl || !vectorizerUrl) {
        await ctx.runMutation(internal.analyses.failAnalysis, {
          analysisId: args.analysisId,
          reason: "Model files missing from storage.",
        });
        return;
      }

      const [modelResp, vectorizerResp] = await Promise.all([
        fetch(modelUrl),
        fetch(vectorizerUrl),
      ]);

      const model = await modelResp.json();
      const vectorizerData = await vectorizerResp.json();

      const vocabulary = new Map<string, number>(vectorizerData.vocabulary);
      const documentFrequency = new Map<string, number>(vectorizerData.documentFrequency);

      // TF-IDF vectorisation
      const words = args.content
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const vector = new Array(vocabulary.size).fill(0);
      const wordCount = new Map<string, number>();

      words.forEach((word) => {
        if (vocabulary.has(word)) {
          wordCount.set(word, (wordCount.get(word) || 0) + 1);
        }
      });

      const totalDocs = 10000;
      wordCount.forEach((count, word) => {
        const idx = vocabulary.get(word);
        if (typeof idx === "number") {
          const tf = count / words.length;
          const docFreq = documentFrequency.get(word);
          if (typeof docFreq === "number") {
            const idf = Math.log(totalDocs / docFreq);
            vector[idx] = tf * idf;
          }
        }
      });

      const prediction = predictWithModel(model, vector);
      const result = prediction.label === 1 ? "Real" : "Fake";

      // Compute top contributing words for explainability
      const topWords = computeTopWords(model, vocabulary, wordCount, words.length, documentFrequency, totalDocs);

      await ctx.runMutation(internal.analyses.updateAnalysisResult, {
        analysisId: args.analysisId,
        result,
        confidence: prediction.confidence,
        topWords,
      });
    } catch (error) {
      console.error("Text prediction error:", error);
      await ctx.runMutation(internal.analyses.failAnalysis, {
        analysisId: args.analysisId,
        reason: "An error occurred during text analysis. Please try again.",
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL queries / mutations
// ─────────────────────────────────────────────────────────────────────────────

export const getLatestReadyModel = internalQuery({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("models")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .order("desc")
      .take(1);
    return models.length > 0 ? models[0] : null;
  },
});

export const getStorageUrl = internalQuery({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

export const updateAnalysisResult = internalMutation({
  args: {
    analysisId: v.id("analyses"),
    result: v.union(v.literal("Real"), v.literal("Fake")),
    confidence: v.number(),
    topWords: v.optional(v.array(v.object({ word: v.string(), score: v.number() }))),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.analysisId, {
      result: args.result,
      confidence: args.confidence,
      topWords: args.topWords,
    });
  },
});

export const failAnalysis = internalMutation({
  args: {
    analysisId: v.id("analyses"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.analysisId, {
      result: "Fake",
      confidence: -1,
      content: args.reason,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC queries
// ─────────────────────────────────────────────────────────────────────────────

export const get = query({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_timestamp")
      .order("desc")
      .take(10);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Logistic Regression inference helpers (text pipeline)
// ─────────────────────────────────────────────────────────────────────────────

function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

function predictWithModel(
  model: { weights: number[]; bias: number },
  vector: number[]
): { label: number; confidence: number } {
  const { weights, bias } = model;
  let z = bias;
  for (let j = 0; j < weights.length; j++) z += weights[j] * vector[j];
  const prob = sigmoid(z);
  const label = prob >= 0.5 ? 1 : 0;
  const rawConf = label === 1 ? prob : 1 - prob;
  return { label, confidence: Math.round(rawConf * 100) / 100 };
}

function computeTopWords(
  model: { weights: number[] },
  vocabulary: Map<string, number>,
  wordCount: Map<string, number>,
  totalWords: number,
  documentFrequency: Map<string, number>,
  totalDocs: number,
  topN = 8
): { word: string; score: number }[] {
  const contributions: { word: string; score: number }[] = [];

  wordCount.forEach((count, word) => {
    const idx = vocabulary.get(word);
    if (typeof idx === "number" && idx < model.weights.length) {
      const tf = count / totalWords;
      const docFreq = documentFrequency.get(word) ?? 1;
      const idf = Math.log(totalDocs / docFreq);
      const tfidf = tf * idf;
      const contribution = model.weights[idx] * tfidf;
      contributions.push({ word, score: Math.round(contribution * 1000) / 1000 });
    }
  });

  // Sort by absolute contribution, return top N
  return contributions
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, topN);
}

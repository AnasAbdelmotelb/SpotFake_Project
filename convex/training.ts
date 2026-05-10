import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

// ── Shared types ──────────────────────────────────────────────────────────────
type LRModel = { weights: number[]; bias: number; type: string };
type TrainResult = { success: boolean; accuracy: number; trainingTime: number };

// Generate a short-lived upload URL for Convex storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Upload training CSV file
export const uploadTrainingFile = mutation({
  args: {
    type: v.union(v.literal("fake"), v.literal("true")),
    storageId: v.id("_storage"),
    fileName: v.string(),
    recordCount: v.number(),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("trainingData", {
      type: args.type,
      fileId: args.storageId,
      fileName: args.fileName,
      recordCount: args.recordCount,
      uploadedAt: Date.now(),
    });

    return fileId;
  },
});

// Get uploaded training files
export const getTrainingFiles = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("trainingData").collect();

    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.fileId),
      }))
    );

    return filesWithUrls;
  },
});

// Get latest model
export const getLatestModel = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("models")
      .withIndex("by_trained_at")
      .order("desc")
      .take(1);

    if (models.length === 0) return null;

    const model = models[0];
    return {
      ...model,
      modelUrl: model.modelFileId ? await ctx.storage.getUrl(model.modelFileId) : null,
      vectorizerUrl: model.vectorizerFileId ? await ctx.storage.getUrl(model.vectorizerFileId) : null,
    };
  },
});

// Get all models
export const getAllModels = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("models")
      .withIndex("by_trained_at")
      .order("desc")
      .collect();

    return models;
  },
});

// Start training process
export const startTraining = mutation({
  args: {},
  handler: async (ctx) => {
    const fakeFiles = await ctx.db
      .query("trainingData")
      .withIndex("by_type", (q) => q.eq("type", "fake"))
      .order("desc")
      .collect();

    const trueFiles = await ctx.db
      .query("trainingData")
      .withIndex("by_type", (q) => q.eq("type", "true"))
      .order("desc")
      .collect();

    if (fakeFiles.length === 0 || trueFiles.length === 0) {
      throw new ConvexError("Please upload both Fake.csv and True.csv files before training");
    }

    const modelId = await ctx.db.insert("models", {
      name: "SpotFake Model",
      version: `v${Date.now()}`,
      trainedAt: Date.now(),
      status: "training",
    });

    await ctx.scheduler.runAfter(0, internal.training.trainModel, {
      modelId,
      fakeFileId: fakeFiles[0].fileId,
      trueFileId: trueFiles[0].fileId,
    });

    return modelId;
  },
});

// Internal action to perform training (Node.js environment)
export const trainModel = internalAction({
  args: {
    modelId: v.id("models"),
    fakeFileId: v.id("_storage"),
    trueFileId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<TrainResult> => {
    try {
      const startTime = Date.now();

      const [fakeUrl, trueUrl] = await Promise.all([
        ctx.runQuery(internal.analyses.getStorageUrl, { fileId: args.fakeFileId }),
        ctx.runQuery(internal.analyses.getStorageUrl, { fileId: args.trueFileId }),
      ]);

      if (!fakeUrl || !trueUrl) {
        throw new Error("Training files not found");
      }

      async function streamCSVTexts(url: string, maxSamples: number): Promise<string[]> {
        const response = await fetch(url);
        if (!response.body) throw new Error("No body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let inQuotes = false;
        let isFirstLine = true;
        const results: string[] = [];
        
        try {
          while (results.length < maxSamples) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            let lastCut = 0;
            for (let i = 0; i < buffer.length; i++) {
              if (buffer[i] === '"') {
                inQuotes = !inQuotes;
              } else if (buffer[i] === '\n' && !inQuotes) {
                const line = buffer.slice(lastCut, i).trim();
                lastCut = i + 1;
                if (isFirstLine) {
                  isFirstLine = false;
                  continue;
                }
                const match = line.match(/^"?([^"]*)"?,"?([^"]*)"?/);
                const text = (match ? match[2] || match[1] : line).replace(/""/g, '"');
                if (text && text.length > 10) {
                  results.push(text.slice(0, 5000));
                }
                if (results.length >= maxSamples) break;
              }
            }
            buffer = buffer.slice(lastCut);
          }
          await reader.cancel().catch(() => {});
        } catch (e) {
          console.error("Stream reading error", e);
        }
        return results;
      }

      const fakeTexts = await streamCSVTexts(fakeUrl, 500);
      const trueTexts = await streamCSVTexts(trueUrl, 500);

      // Reproducible random number generator (seed = 42)
      function mulberry32(a: number) {
        return function() {
          let t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
      }
      const random = mulberry32(42);

      const allData = [
        ...fakeTexts.map(text => ({ text, label: 0 })),
        ...trueTexts.map(text => ({ text, label: 1 })),
      ];

      // Shuffle using the seeded random function
      for (let i = allData.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [allData[i], allData[j]] = [allData[j], allData[i]];
      }

      // 80/20 train/test split
      const splitIdx = Math.floor(allData.length * 0.8);
      const trainData = allData.slice(0, splitIdx);
      const testData = allData.slice(splitIdx);

      // Build vocabulary
      const STOP_WORDS = new Set([
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "it", "it's", "its", "itself", "let's", "me", "more", "most", "my", "myself", "nor", "of", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "she'd", "she'll", "she's", "should", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "we'd", "we'll", "we're", "we've", "were", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "would", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
      ]);
      const documentFrequency = new Map<string, number>();

      trainData.forEach(({ text }) => {
        const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
        const uniqueWords = new Set(words);
        uniqueWords.forEach(word => {
          documentFrequency.set(word, (documentFrequency.get(word) || 0) + 1);
        });
      });

      const maxDfThresh = trainData.length * 0.7; // max_df=0.7
      const minDfThresh = 5; // min_df=5

      const filteredWords = Array.from(documentFrequency.entries())
        .filter(([_, df]) => df >= minDfThresh && df <= maxDfThresh)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5000) // max_features=5000
        .map(([word]) => word);

      const finalVocabulary = new Map(filteredWords.map((word, idx) => [word, idx]));

      const vectorize = (text: string): number[] => {
        const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
        const vector = new Array(finalVocabulary.size).fill(0);
        const wordCount = new Map<string, number>();
        words.forEach(word => {
          if (finalVocabulary.has(word)) wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });
        
        let squaredSum = 0;
        wordCount.forEach((count, word) => {
          const idx = finalVocabulary.get(word)!;
          const tf = count / words.length;
          const idf = Math.log(trainData.length / (documentFrequency.get(word) || 1));
          const val = tf * idf;
          vector[idx] = val;
          squaredSum += val * val;
        });
        
        const norm = Math.sqrt(squaredSum) || 1;
        for (let i = 0; i < vector.length; i++) {
          vector[i] /= norm;
        }
        
        return vector;
      };

      const trainVectors = trainData.map(d => vectorize(d.text));
      const trainLabels = trainData.map(d => d.label);
      const testVectors = testData.map(d => vectorize(d.text));
      const testLabels = testData.map(d => d.label);

      // max_iter=1000, C=0.5 -> lambda = 1 / 0.5 = 2.0
      const model = trainLogisticRegression(trainVectors, trainLabels, random, 1.0, 1000, 256, 2.0);

      // Evaluate on test set
      let tp = 0, tn = 0, fp = 0, fn = 0;
      testVectors.forEach((vector, idx) => {
        const pred = predictLR(model, vector);
        const actual = testLabels[idx];
        if (pred === 1 && actual === 1) tp++;
        else if (pred === 0 && actual === 0) tn++;
        else if (pred === 1 && actual === 0) fp++;
        else fn++;
      });

      const accuracy = (tp + tn) / testData.length;
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

      // Serialize model and vectorizer
      const modelData = JSON.stringify(model);
      const vectorizerData = JSON.stringify({
        vocabulary: Array.from(finalVocabulary.entries()),
        documentFrequency: Array.from(documentFrequency.entries()),
      });

      const modelBlob = new Blob([modelData], { type: 'application/json' });
      const vectorizerBlob = new Blob([vectorizerData], { type: 'application/json' });

      const modelUploadUrl = await ctx.storage.generateUploadUrl();
      const vectorizerUploadUrl = await ctx.storage.generateUploadUrl();

      const modelUpload = await fetch(modelUploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: modelBlob,
      });

      const vectorizerUpload = await fetch(vectorizerUploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: vectorizerBlob,
      });

      const modelResult = await modelUpload.json();
      const vectorizerResult = await vectorizerUpload.json();

      const trainingTime = Date.now() - startTime;

      await ctx.runMutation(internal.training.updateModelAfterTraining, {
        modelId: args.modelId,
        modelFileId: modelResult.storageId,
        vectorizerFileId: vectorizerResult.storageId,
        accuracy,
        trainingStats: {
          totalSamples: trainData.length,
          fakeSamples: fakeTexts.length,
          trueSamples: trueTexts.length,
          trainingTime,
        },
        evaluationMetrics: {
          precision: Math.round(precision * 10000) / 10000,
          recall: Math.round(recall * 10000) / 10000,
          f1Score: Math.round(f1Score * 10000) / 10000,
          truePositives: tp,
          trueNegatives: tn,
          falsePositives: fp,
          falseNegatives: fn,
        },
      });

      return { success: true, accuracy, trainingTime };
    } catch (error) {
      await ctx.runMutation(internal.training.markModelFailed, { modelId: args.modelId });
      throw error;
    }
  },
});

// Update model after successful training
export const updateModelAfterTraining = internalMutation({
  args: {
    modelId: v.id("models"),
    modelFileId: v.id("_storage"),
    vectorizerFileId: v.id("_storage"),
    accuracy: v.number(),
    trainingStats: v.object({
      totalSamples: v.number(),
      fakeSamples: v.number(),
      trueSamples: v.number(),
      trainingTime: v.number(),
    }),
    evaluationMetrics: v.object({
      precision: v.number(),
      recall: v.number(),
      f1Score: v.number(),
      truePositives: v.number(),
      trueNegatives: v.number(),
      falsePositives: v.number(),
      falseNegatives: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.modelId, {
      modelFileId: args.modelFileId,
      vectorizerFileId: args.vectorizerFileId,
      accuracy: args.accuracy,
      trainingStats: args.trainingStats,
      evaluationMetrics: args.evaluationMetrics,
      status: "ready",
    });
  },
});

// Mark model as failed
export const markModelFailed = internalMutation({
  args: { modelId: v.id("models") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.modelId, { status: "failed" });
  },
});

// ── Logistic Regression helpers ──────────────────────────────────────────────

function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  } else {
    const e = Math.exp(z);
    return e / (1 + e);
  }
}

function trainLogisticRegression(
  vectors: number[][],
  labels: number[],
  random: () => number,
  learningRate = 1.0,
  epochs = 1000,
  batchSize = 256,
  lambda = 2.0
): LRModel {
  const n = vectors.length;
  const d = vectors[0].length;

  const weights = new Array(d).fill(0).map(() => (random() - 0.5) * 0.01);
  let bias = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let start = 0; start < n; start += batchSize) {
      const batch = indices.slice(start, start + batchSize);
      const bLen = batch.length;
      const dw = new Array(d).fill(0);
      let db = 0;

      for (const idx of batch) {
        const x = vectors[idx];
        const y = labels[idx];
        let z = bias;
        for (let j = 0; j < d; j++) z += weights[j] * x[j];
        const yHat = sigmoid(z);
        const err = yHat - y;
        for (let j = 0; j < d; j++) dw[j] += err * x[j];
        db += err;
      }

      const scale = learningRate / bLen;
      for (let j = 0; j < d; j++) {
        weights[j] -= scale * (dw[j] + lambda * weights[j]);
      }
      bias -= scale * db;
    }
  }

  return { weights, bias, type: "logistic_regression" };
}

function predictLR(model: { weights: number[]; bias: number }, vector: number[]): number {
  let z = model.bias;
  for (let j = 0; j < model.weights.length; j++) z += model.weights[j] * vector[j];
  return sigmoid(z) >= 0.5 ? 1 : 0;
}

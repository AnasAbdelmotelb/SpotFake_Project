import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  analyses: defineTable({
    type: v.union(v.literal("text"), v.literal("image")),
    content: v.string(),
    result: v.union(v.literal("Real"), v.literal("Fake"), v.literal("Pending")),
    confidence: v.number(),
    timestamp: v.number(),
    userId: v.optional(v.id("users")),
    // Image-specific fields
    imageFeatures: v.optional(v.array(v.number())),
    imageAnalysisDetails: v.optional(v.object({
      colorConsistency: v.number(),
      noiseLevel: v.number(),
      compressionArtifacts: v.number(),
      edgeSharpness: v.number(),
      frequencyAnomaly: v.number(),
      faceRegionScore: v.number(),
    })),
    // Explainability fields
    topWords: v.optional(v.array(v.object({ word: v.string(), score: v.number() }))),
  }).index("by_timestamp", ["timestamp"]),

  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  trainingData: defineTable({
    type: v.union(v.literal("fake"), v.literal("true")),
    fileId: v.id("_storage"),
    fileName: v.string(),
    recordCount: v.number(),
    uploadedAt: v.number(),
  }).index("by_type", ["type"]),

  models: defineTable({
    name: v.string(),
    version: v.string(),
    modelFileId: v.optional(v.id("_storage")),
    vectorizerFileId: v.optional(v.id("_storage")),
    accuracy: v.optional(v.number()),
    trainedAt: v.number(),
    status: v.union(v.literal("training"), v.literal("ready"), v.literal("failed")),
    trainingStats: v.optional(v.object({
      totalSamples: v.number(),
      fakeSamples: v.number(),
      trueSamples: v.number(),
      trainingTime: v.number(),
    })),
    // Evaluation metrics stored after training
    evaluationMetrics: v.optional(v.object({
      precision: v.number(),
      recall: v.number(),
      f1Score: v.number(),
      truePositives: v.number(),
      trueNegatives: v.number(),
      falsePositives: v.number(),
      falseNegatives: v.number(),
    })),
  }).index("by_status", ["status"])
    .index("by_trained_at", ["trainedAt"]),

  // Dedicated table for image deepfake detection models
  imageModels: defineTable({
    name: v.string(),
    version: v.string(),
    modelFileId: v.id("_storage"),
    featureCount: v.number(),
    accuracy: v.optional(v.number()),
    trainedAt: v.number(),
    status: v.union(v.literal("ready"), v.literal("failed")),
    description: v.optional(v.string()),
  }).index("by_status", ["status"])
    .index("by_trained_at", ["trainedAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

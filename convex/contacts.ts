import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.name.trim()) {
      throw new ConvexError("Please enter your name");
    }
    if (!args.email.trim() || !args.email.includes("@")) {
      throw new ConvexError("Please enter a valid email address");
    }
    if (!args.message.trim()) {
      throw new ConvexError("Please enter a message");
    }

    await ctx.db.insert("contacts", {
      name: args.name,
      email: args.email,
      message: args.message,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

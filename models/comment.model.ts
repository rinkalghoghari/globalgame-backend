import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true },
    name: { type: String, required: true },
    comment: { type: String, required: true }
  },
  { timestamps: true,
    versionKey: false
   }
);

commentSchema.index({ gameId: 1, createdAt: -1 });
export default mongoose.model("Comment", commentSchema);

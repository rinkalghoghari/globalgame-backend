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

export default mongoose.model("Comment", commentSchema);

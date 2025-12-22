import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true }, 
    rating: { type: Number, min: 1, max: 5, required: true },
    ip: { type: String },
    name: { type: String, required: true },
  },
  { timestamps: true,
    versionKey: false
  }
);

ratingSchema.index({ gameId: 1 });
ratingSchema.index({ gameId: 1, ip: 1 }, { unique: true });
export default mongoose.model("Rating", ratingSchema);

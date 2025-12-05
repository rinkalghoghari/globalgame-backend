import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String },
    description: String,
    instructions: String,
    url: String,
    image: String,
    category: String,
    tags: String,
    thumb: String,
    width: String,
    height: String,
    Popularity:String,
    gameControls:[{ key: String, action: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model("Game", gameSchema);


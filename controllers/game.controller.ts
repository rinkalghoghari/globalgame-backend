import Game from "../models/game.model";
import Rating from "../models/rating.model";
import Comment from "../models/comment.model";
import { games } from "../seed/games";

export const addGame = async (req: any, res: any) => {
  try {
    // const { gameId, title, description, instructions, url,image, category, tags, thumb, width, height } = req.body;
    // const newGame = await Game.create({ gameId, title, description, instructions, url, image, category, tags, thumb, width, height });
    const newGame = await Game.create(games);
    res.status(201).json({ success: true, message: "Game added successfully", data: newGame });
  } catch (error: any) {
    console.error("Add game error:", error);
    res.status(500).json({ success: false, message: "Failed to add game", error: error.message });
  }
};


export const getGames = async (req: any, res: any) => {
  try {
    const games = await Game.find();
    res.json({
      data: games
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch games",
      error: error.message
    });
  }
};


export const deleteGamesById = async (req:any, res:any) => {
  try {
    const { id } = req.params;

    const deletedGame = await Game.findByIdAndDelete(id);

    if (!deletedGame) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    // 2. Delete related comments
    await Comment.deleteMany({ gameId: id });

    // 3. Delete related ratings
    await Rating.deleteMany({ gameId: id });

    return res.json({
      success: true,
      message: "Game and all related data deleted successfully",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete game",
      error: error.message,
    });
  }
};

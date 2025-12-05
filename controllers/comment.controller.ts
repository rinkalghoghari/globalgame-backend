import Comment from "../models/comment.model";

export const addComment = async (req: any, res: any) => {
  try {
    const { gameId, name, comment } = req.body;

    // Validation
    if (!gameId || !name || !comment) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // if (name.trim().length < 2) {
    //   return res.status(400).json({ 
    //     success: false,
    //     message: "Name must be at least 2 characters" 
    //   });
    // }

    // if (comment.trim().length < 5) {
    //   return res.status(400).json({ 
    //     success: false,
    //     message: "Comment must be at least 5 characters" 
    //   });
    // }

    const newComment = await Comment.create({ gameId, name, comment });

    res.status(201).json({ success: true,message: "Comment added successfully", data: newComment});
  } catch (error: any) {
    console.error("Add comment error:", error);
    res.status(500).json({ success: false, message: "Failed to add comment", error: error.message });
  }
};

export const getComments = async (req: any, res: any) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({ 
        success: false,
        message: "Game ID is required" 
      });
    }

    const comments = await Comment.find({ gameId })
      .sort({ createdAt: -1 })
      .limit(100); 

    const formattedComments = comments.map(comment => ({
      id: comment._id,
      gameId: comment.gameId,
      name: comment.name,
      comment: comment.comment,
      createdAt: comment.createdAt,
    }));

    res.json({
      success: true,
      data: formattedComments,
      total: formattedComments.length
    });
  } catch (error: any) {
    console.error("Get comments error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch comments",
      error: error.message 
    });
  }
};

export const deleteComment = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Comment ID is required" 
      });
    }

    const comment = await Comment.findByIdAndDelete(id);

    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: "Comment not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Comment deleted successfully" 
    });
  } catch (error: any) {
    console.error("Delete comment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete comment",
      error: error.message 
    });
  }
};

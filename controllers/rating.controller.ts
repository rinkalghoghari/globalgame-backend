import Rating from "../models/rating.model";

export const addRating = async (req: any, res: any) => {
  try {
    const { gameId, rating , name } = req.body;
    
   let ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      req.ip;
      
    if (!gameId || !rating || !name) {
      return res.status(400).json({ 
        success: false,
        message: "Game ID , rating and name are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: "Rating must be between 1 and 5" 
      });
    }

    const alreadyRated = await Rating.findOne({ gameId, ip });

    if (alreadyRated) {
      return res.status(400).json({ 
        success: false,
        message: "You have already rated this game" 
      });
    }

    // Add new rating
    const newRating = await Rating.create({ 
      gameId: gameId.trim(), 
      rating, 
      ip,
      name: name.trim() 
    });

    // Calculate new stats
    const stats = await calculateRatingStats(gameId);

    res.status(201).json({ 
      success: true,
      message: "Rating added successfully", 
      data: {
        rating: newRating.rating,
        name: newRating.name,
        ...stats
      }
    });
  } catch (error: any) {
    console.error("Add rating error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to add rating",
      error: error.message 
    });
  }
};

export const getRatingStats = async (req: any, res: any) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({ 
        success: false,
        message: "Game ID is required" 
      });
    }

    const stats = await calculateRatingStats(gameId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error("Get rating stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch rating statistics",
      error: error.message 
    });
  }
};

export const checkUserRating = async (req: any, res: any) => {
  try {
    const { gameId } = req.params;
    const ip = req.ip || 
               req.headers['x-forwarded-for']?.split(',')[0] || 
               req.connection.remoteAddress;

    const userRating = await Rating.findOne({ gameId, ip });

    res.json({
      success: true,
      data: {
        hasRated: !!userRating,
        rating: userRating?.rating || 0
      }
    });
  } catch (error: any) {
    console.error("Check user rating error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to check user rating",
      error: error.message 
    });
  }
};

async function calculateRatingStats(gameId: string) {
  const ratings = await Rating.find({ gameId });
    if (ratings.length === 0) {
    return {
      total: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const sum = ratings.reduce((total:any, r: any) => total + r.rating, 0);
  const average = parseFloat((sum / ratings.length).toFixed(1));
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r: any) => {
    distribution[r.rating as keyof typeof distribution]++;
  });
  return {
    total: ratings.length,
    average,
    distribution
  };
}






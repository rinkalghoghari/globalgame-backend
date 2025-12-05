export const authMiddleware = (req:any, res:any, next:any) => {
  const key = req.headers["x-api-key"];

  if (key !== process.env.BACKEND_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

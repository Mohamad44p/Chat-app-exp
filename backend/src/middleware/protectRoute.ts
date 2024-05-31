import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import db from "../db/db.js";

interface DecodedToken extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    export interface Request {
      user: {
        id: string;
      };
    }
  }
}
const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    if (!decoded) return res.status(401).json({ error: "Unauthorized" });
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        profilePic: true,
      },
    });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = user;

    next();
  } catch (error: any) {
    console.log("Error in protectRoute middleware", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default protectRoute;

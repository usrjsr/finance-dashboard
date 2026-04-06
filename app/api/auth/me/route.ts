import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { apiResponse, apiError } from "@/lib/helpers";
import { requireAuth, SessionUser } from "@/middlewares/auth";

export const GET = requireAuth(
  async (
    _req: NextRequest,
    _context: { params: Promise<Record<string, string>> },
    session: SessionUser,
  ) => {
    try {
      await connectDB();

      const user = await User.findById(session.id).select("-password");
      if (!user) return apiError("User not found", 404);

      return apiResponse({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch {
      return apiError("Internal server error", 500);
    }
  },
);

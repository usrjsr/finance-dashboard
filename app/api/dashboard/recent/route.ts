import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Record from "@/models/Record";
import { apiResponse, apiError } from "@/lib/helpers";
import { requireAuth, SessionUser } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/role";
import mongoose from "mongoose";

export const GET = requireAuth(
  requireRole("analyst")(
    async (_req: NextRequest, _context: { params: Promise<Record<string, string>> }, session: SessionUser) => {
      try {
        await connectDB();

        const filter =
          session.role === "viewer"
            ? { isDeleted: false, userId: new mongoose.Types.ObjectId(session.id) }
            : { isDeleted: false };

        const records = await Record.find(filter)
          .sort({ date: -1 })
          .limit(10)
          .populate("userId", "name email");

        return apiResponse({
          records: records.map((r) => ({
            id: r._id.toString(),
            user: r.userId,
            amount: r.amount,
            type: r.type,
            category: r.category,
            date: r.date,
            description: r.description,
            createdAt: r.createdAt,
          })),
        });
      } catch {
        return apiError("Internal server error", 500);
      }
    }
  )
);

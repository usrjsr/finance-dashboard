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

        const matchStage =
          session.role === "viewer"
            ? { isDeleted: false, userId: new mongoose.Types.ObjectId(session.id) }
            : { isDeleted: false };

        const categories = await Record.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$category",
              totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
              totalExpenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              category: "$_id",
              totalIncome: 1,
              totalExpenses: 1,
              net: { $subtract: ["$totalIncome", "$totalExpenses"] },
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ]);

        return apiResponse({ categories });
      } catch {
        return apiError("Internal server error", 500);
      }
    }
  )
);

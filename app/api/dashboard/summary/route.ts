import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Record from "@/models/Record";
import { apiResponse, apiError } from "@/lib/helpers";
import { requireAuth, SessionUser } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/role";
import mongoose from "mongoose";

export const GET = requireAuth(
  requireRole("analyst")(
    async (
      _req: NextRequest,
      _context: { params: Promise<Record<string, string>> },
      session: SessionUser,
    ) => {
      try {
        await connectDB();

        const matchStage =
          session.role === "viewer"
            ? {
                isDeleted: false,
                userId: new mongoose.Types.ObjectId(session.id),
              }
            : { isDeleted: false };

        const result = await Record.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalIncome: {
                $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
              },
              totalExpenses: {
                $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
              },
              totalRecords: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalIncome: 1,
              totalExpenses: 1,
              netBalance: { $subtract: ["$totalIncome", "$totalExpenses"] },
              totalRecords: 1,
            },
          },
        ]);

        const summary = result[0] ?? {
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
          totalRecords: 0,
        };

        return apiResponse(summary);
      } catch {
        return apiError("Internal server error", 500);
      }
    },
  ),
);

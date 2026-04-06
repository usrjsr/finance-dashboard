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

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const matchStage =
          session.role === "viewer"
            ? {
                isDeleted: false,
                date: { $gte: twelveMonthsAgo },
                userId: new mongoose.Types.ObjectId(session.id),
              }
            : { isDeleted: false, date: { $gte: twelveMonthsAgo } };

        const trends = await Record.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: { year: { $year: "$date" }, month: { $month: "$date" } },
              income: {
                $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
              },
              expenses: {
                $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              income: 1,
              expenses: 1,
              net: { $subtract: ["$income", "$expenses"] },
              count: 1,
            },
          },
          { $sort: { year: 1, month: 1 } },
        ]);

        return apiResponse({ trends });
      } catch {
        return apiError("Internal server error", 500);
      }
    },
  ),
);

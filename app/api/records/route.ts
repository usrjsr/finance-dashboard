import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Record from "@/models/Record";
import User from "@/models/User";
import { apiResponse, apiError, parsePaginationParams, paginationMeta } from "@/lib/helpers";
import { requireAuth, SessionUser } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/role";
import { createRecordSchema } from "@/validators/record";
import mongoose from "mongoose";

export const GET = requireAuth(
  async (req: NextRequest, _context: { params: Promise<Record<string, string>> }, session: SessionUser) => {
    try {
      await connectDB();

      const { searchParams } = new URL(req.url);
      const { page, limit, skip } = parsePaginationParams(searchParams);


      const filter: Record<string, any> = { isDeleted: false };

      if (session.role === "viewer") {
        filter.userId = new mongoose.Types.ObjectId(session.id);
      }

      const type = searchParams.get("type");
      if (type === "income" || type === "expense") filter.type = type;

      const category = searchParams.get("category");
      if (category) filter.category = { $regex: new RegExp(category, "i") };

      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      const [records, total] = await Promise.all([
        Record.find(filter).sort({ date: -1 }).skip(skip).limit(limit).populate("userId", "name email"),
        Record.countDocuments(filter),
      ]);

      return apiResponse({
        records: records.map((r) => ({
          id: r._id.toString(),
          userId: r.userId,
          amount: r.amount,
          type: r.type,
          category: r.category,
          date: r.date,
          description: r.description,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        pagination: paginationMeta(total, page, limit),
      });
    } catch {
      return apiError("Internal server error", 500);
    }
  }
);

export const POST = requireAuth(
  requireRole("admin")(
    async (req: NextRequest, _context: { params: Promise<Record<string, string>> }, session: SessionUser) => {
      try {
        const body = await req.json();

        const parsed = createRecordSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(parsed.error.issues.map((e) => e.message).join(", "), 422);
        }

        await connectDB();

        await connectDB();

        const { userId: bodyUserId, ...recordData } = parsed.data;
        let assignedUserId;

        if (session.role === "admin") {
          if (!bodyUserId || !mongoose.isValidObjectId(bodyUserId)) {
            return apiError("Admin must provide a valid user ID to assign this record to.", 400);
          }
          const userObj = await User.findById(bodyUserId);
          if (!userObj || userObj.role !== "viewer") {
            return apiError("Records can only be added for viewers.", 403);
          }
          assignedUserId = new mongoose.Types.ObjectId(bodyUserId);
        } else {
          assignedUserId = new mongoose.Types.ObjectId(session.id);
        }

        const record = await Record.create({
          ...recordData,
          userId: assignedUserId,
        });

        return apiResponse(
          {
            id: record._id.toString(),
            userId: record.userId,
            amount: record.amount,
            type: record.type,
            category: record.category,
            date: record.date,
            description: record.description,
            createdAt: record.createdAt,
          },
          { status: 201 }
        );
      } catch {
        return apiError("Internal server error", 500);
      }
    }
  )
);

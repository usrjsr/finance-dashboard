import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Record from "@/models/Record";
import { apiResponse, apiError } from "@/lib/helpers";
import { requireAuth, SessionUser } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/role";
import { updateRecordSchema } from "@/validators/record";
import mongoose from "mongoose";

type Params = { params: Promise<Record<string, string>> };

export const GET = requireAuth(
  async (_req: NextRequest, context: Params, session: SessionUser) => {
    try {
      const { id } = (await context.params) as { id: string };
      if (!mongoose.isValidObjectId(id)) return apiError("Invalid record ID format", 400);

      await connectDB();
      const record = await Record.findOne({ _id: id, isDeleted: false }).populate("userId", "name email");
      if (!record) return apiError("Record not found", 404);

      if (session.role === "viewer" && record.userId.toString() !== session.id) {
        return apiError("Access denied. This record does not belong to you.", 403);
      }

      return apiResponse({
        id: record._id.toString(),
        userId: record.userId,
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: record.date,
        description: record.description,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    } catch {
      return apiError("Internal server error", 500);
    }
  }
);

export const PUT = requireAuth(
  requireRole("admin")(
    async (req: NextRequest, context: Params, _session: SessionUser) => {
      try {
        const { id } = (await context.params) as { id: string };
        if (!mongoose.isValidObjectId(id)) return apiError("Invalid record ID format", 400);

        const body = await req.json();
        const parsed = updateRecordSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(parsed.error.issues.map((e) => e.message).join(", "), 422);
        }

        await connectDB();

        const updateData: Record<string, any> = { ...parsed.data };

        // Ensure userId cannot be updated
        delete updateData.userId;

        const record = await Record.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!record) return apiError("Record not found", 404);

        return apiResponse({
          id: record._id.toString(),
          userId: record.userId,
          amount: record.amount,
          type: record.type,
          category: record.category,
          date: record.date,
          description: record.description,
          updatedAt: record.updatedAt,
        });
      } catch {
        return apiError("Internal server error", 500);
      }
    }
  )
);

export const DELETE = requireAuth(
  requireRole("admin")(
    async (_req: NextRequest, context: Params, _session: SessionUser) => {
      try {
        const { id } = (await context.params) as { id: string };
        if (!mongoose.isValidObjectId(id)) return apiError("Invalid record ID format", 400);

        await connectDB();
        const record = await Record.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true } },
          { new: true }
        );

        if (!record) return apiError("Record not found", 404);

        return apiResponse({ message: "Record deleted successfully", id: record._id.toString() });
      } catch {
        return apiError("Internal server error", 500);
      }
    }
  )
);

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { apiResponse, apiError } from "@/lib/helpers";
import { requireAuth, SessionUser } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/role";
import { updateUserSchema } from "@/validators/user";
import mongoose from "mongoose";

type Params = { params: Promise<Record<string, string>> };

export const GET = requireAuth(
  requireRole("admin")(
    async (_req: NextRequest, context: Params, _session: SessionUser) => {
      try {
        const { id } = (await context.params) as { id: string };
        if (!mongoose.isValidObjectId(id)) return apiError("Invalid user ID format", 400);

        await connectDB();
        const user = await User.findById(id).select("-password");
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
    }
  )
);

export const PUT = requireAuth(
  requireRole("admin")(
    async (req: NextRequest, context: Params, _session: SessionUser) => {
      try {
        const { id } = (await context.params) as { id: string };
        if (!mongoose.isValidObjectId(id)) return apiError("Invalid user ID format", 400);

        const body = await req.json();
        const parsed = updateUserSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(parsed.error.issues.map((e) => e.message).join(", "), 422);
        }

        await connectDB();
        const user = await User.findByIdAndUpdate(
          id,
          { $set: parsed.data },
          { new: true, runValidators: true }
        ).select("-password");

        if (!user) return apiError("User not found", 404);

        return apiResponse({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          updatedAt: user.updatedAt,
        });
      } catch {
        return apiError("Internal server error", 500);
      }
    }
  )
);

export const DELETE = requireAuth(
  requireRole("admin")(
    async (_req: NextRequest, context: Params, session: SessionUser) => {
      try {
        const { id } = (await context.params) as { id: string };
        if (!mongoose.isValidObjectId(id)) return apiError("Invalid user ID format", 400);
        if (id === session.id) return apiError("You cannot deactivate your own account", 400);

        await connectDB();
        const user = await User.findByIdAndUpdate(
          id,
          { $set: { status: "inactive" } },
          { new: true }
        ).select("-password");

        if (!user) return apiError("User not found", 404);

        return apiResponse({
          message: "User deactivated successfully",
          id: user._id.toString(),
          status: user.status,
        });
      } catch {
        return apiError("Internal server error", 500);
      }
    }
  )
);

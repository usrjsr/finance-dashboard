import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import {
  apiResponse,
  apiError,
  parsePaginationParams,
  paginationMeta,
} from "@/lib/helpers";
import { requireAuth, SessionUser } from "@/middlewares/auth";
import { requireRole } from "@/middlewares/role";
import { registerSchema } from "@/validators/user";

export const GET = requireAuth(
  requireRole("admin")(
    async (
      req: NextRequest,
      _context: { params: Promise<Record<string, string>> },
      _session: SessionUser,
    ) => {
      try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = parsePaginationParams(searchParams);

        const [users, total] = await Promise.all([
          User.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          User.countDocuments(),
        ]);

        return apiResponse({
          users: users.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          })),
          pagination: paginationMeta(total, page, limit),
        });
      } catch {
        return apiError("Internal server error", 500);
      }
    },
  ),
);

export const POST = requireAuth(
  requireRole("admin")(
    async (
      req: NextRequest,
      _context: { params: Promise<Record<string, string>> },
      _session: SessionUser,
    ) => {
      try {
        const body = await req.json();

        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
          return apiError(
            parsed.error.issues.map((e) => e.message).join(", "),
            422,
          );
        }

        const { name, email, password, role } = parsed.data;

        await connectDB();
        const existing = await User.findOne({ email });
        if (existing)
          return apiError("An account with this email already exists", 409);

        const user = await User.create({ name, email, password, role });

        return apiResponse(
          {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
          },
          { status: 201 },
        );
      } catch {
        return apiError("Internal server error", 500);
      }
    },
  ),
);

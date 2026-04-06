import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { apiResponse, apiError } from "@/lib/helpers";
import { z } from "zod";

const seedSchema = z.object({
  secret: z.string().min(1),
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = seedSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues.map((e) => e.message).join(", "),
        422,
      );
    }

    const { secret, name, email, password } = parsed.data;

    if (secret !== process.env.SEED_SECRET) {
      return apiError("Invalid seed secret", 403);
    }

    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return apiError(
        "An admin account already exists. Seeding is disabled.",
        409,
      );
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      status: "active",
    });

    return apiResponse(
      {
        message:
          "Admin account created successfully. Remove or disable this endpoint after first use.",
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      { status: 201 },
    );
  } catch {
    return apiError("Internal server error", 500);
  }
}

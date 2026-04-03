import { auth } from "@/lib/auth";
import { apiError } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "viewer" | "analyst" | "admin";
  status: "active" | "inactive";
};

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
  session: SessionUser
) => Promise<NextResponse>;

export function requireAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user) return apiError("Unauthorized. Please log in.", 401);
    if (session.user.status === "inactive") return apiError("Your account has been deactivated.", 403);

    return handler(req, context, session.user as SessionUser);
  };
}

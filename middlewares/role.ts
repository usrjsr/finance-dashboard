import { apiError } from "@/lib/helpers";
import { SessionUser } from "@/middlewares/auth";
import { NextRequest, NextResponse } from "next/server";

type Role = "viewer" | "analyst" | "admin";

const ROLE_LEVELS: Record<Role, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

type AuthedRouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
  session: SessionUser
) => Promise<NextResponse>;

export function requireRole(...allowedRoles: Role[]) {
  return function (handler: AuthedRouteHandler): AuthedRouteHandler {
    return async (
      req: NextRequest,
      context: { params: Promise<Record<string, string>> },
      session: SessionUser
    ): Promise<NextResponse> => {
      const userLevel = ROLE_LEVELS[session.role];
      const hasPermission = allowedRoles.some((role) => userLevel >= ROLE_LEVELS[role]);

      if (!hasPermission) {
        return apiError(
          `Access denied. Required: ${allowedRoles.join(" or ")}. Your role: ${session.role}`,
          403
        );
      }

      return handler(req, context, session);
    };
  };
}

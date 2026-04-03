import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "viewer" | "analyst" | "admin";
      status: "active" | "inactive";
    } & DefaultSession["user"];
  }

  interface User {
    role: "viewer" | "analyst" | "admin";
    status: "active" | "inactive";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "viewer" | "analyst" | "admin";
    status: "active" | "inactive";
  }
}

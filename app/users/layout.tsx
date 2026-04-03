import ProtectedLayout from "@/components/protected-layout";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

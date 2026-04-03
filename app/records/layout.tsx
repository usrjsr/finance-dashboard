import ProtectedLayout from "@/components/protected-layout";

export default function RecordsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

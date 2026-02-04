import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs | Swan Swim Management",
};

export default function AuditLogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

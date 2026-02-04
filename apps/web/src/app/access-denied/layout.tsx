import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Denied | Swan Swim Management",
};

export default function AccessDeniedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

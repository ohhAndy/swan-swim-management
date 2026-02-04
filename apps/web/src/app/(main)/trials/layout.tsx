import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trials | Swan Swim Management",
};

export default function TrialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

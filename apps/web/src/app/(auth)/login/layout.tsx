import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Swan Swim Management",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

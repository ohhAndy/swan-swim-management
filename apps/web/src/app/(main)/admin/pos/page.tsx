import { Metadata } from "next";
import QuickSaleClient from "./QuickSaleClient";

export const metadata: Metadata = {
  title: "Point of Sale | Swan Swim Management",
};

export default function POSPage() {
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden p-6 bg-slate-50/50">
      <QuickSaleClient />
    </div>
  );
}

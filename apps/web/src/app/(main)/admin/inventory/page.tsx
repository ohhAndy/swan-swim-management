import { Metadata } from "next";
import InventoryListClient from "./InventoryListClient";

export const metadata: Metadata = {
  title: "Inventory | Swan Swim Management",
};

export default function InventoryPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
      <InventoryListClient />
    </div>
  );
}

import { getAllTerms } from "@/lib/api/schedule";
import type { Term } from "@school/shared-types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms | Swan Swim Management",
};

import TermSlot from "./TermClientPage";

export default async function TermPage() {
  const terms: Term[] = await getAllTerms();

  // Dynamically group terms by year based on startDate
  const groupByYear = terms.reduce(
    (acc, term) => {
      let year = "Other";
      if (term.startDate) {
        year = new Date(term.startDate).getFullYear().toString();
      } else {
        // Fallback to name parsing if startDate is missing
        const match = term.name.match(/\d{4}/);
        if (match) {
          year = match[0];
        }
      }

      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(term);
      return acc;
    },
    {} as Record<string, Term[]>,
  );

  // Sort years ascending (oldest first)
  const sortedYears = Object.keys(groupByYear).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  // Sort terms within each year by startDate ascending
  Object.keys(groupByYear).forEach((year) => {
    groupByYear[year].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-[#1c82c5]">Terms</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-h-[80vh] overflow-y-auto">
        {sortedYears.map((y) => (
          <TermSlot key={y} termOptions={groupByYear[y]} year={y} />
        ))}
      </div>
    </div>
  );
}

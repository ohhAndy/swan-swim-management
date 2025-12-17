import { getAllTerms } from "@/lib/api/schedule";
import type { Term } from "@school/shared-types";

import { YEARS } from "@/lib/schedule/slots";

import TermSlot  from "./TermClientPage"

export default async function TermPage() {
  const terms: Term[] = await getAllTerms();

  const groupByYear: Record<string, Term[]> = {};
  for (const year of YEARS) {
    groupByYear[year] = [];
  }
  for (const term of terms) {
    const year = term.name.slice(0, 4);
    groupByYear[year].push(term);
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-[#1c82c5]">Terms</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-h-[80vh] overflow-y-auto">
        {YEARS.map((y) => (
          <TermSlot
            key={y}
            termOptions={groupByYear[y]}
            year={y}
          />
        ))}
      </div>
    </div>
  );
}

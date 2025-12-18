"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Term } from "@school/shared-types";

import { useRouter } from "next/navigation";


export default function TermSlot({
  termOptions,
  year,
}: {
  termOptions: Term[];
  year: string;
}) {
  const router = useRouter();

  return (
    <Card className="w-full rounded-sm">
      <CardHeader className="text-lg font-semibold text-center font-fredoka">
        <CardTitle>{year}</CardTitle>
      </CardHeader>
      <CardContent> 
        <div className="flex flex-col gap-2 items-center">
          {termOptions.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant="ghost"
              className="w-full flex rounded-md hover:bg-muted transition cursor-pointer"
              onClick={() =>
                router.push(
                  `/term/${t.id}/schedule/`
                )
              }
            >
              <span className="text-center align-middle text-sm text-[#1c82c5]">{t.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

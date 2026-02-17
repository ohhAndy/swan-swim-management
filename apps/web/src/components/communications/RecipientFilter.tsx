"use client";

import { useEffect, useState } from "react";
import { RecipientFilter } from "@/lib/api/communications-client";
import { getLocations, Location } from "@/lib/api/location-client";
import { getTerms, Term } from "@/lib/api/term-client";
import { getInstructors } from "@/lib/api/instructors";
import {
  PRESCHOOL_LEVELS,
  SWIMMER_LEVELS,
  SWIMTEAM_LEVELS,
  PARENT_TOT_LEVELS,
} from "@/lib/constants/levels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface RecipientFilterProps {
  filter: RecipientFilter;
  onChange: (filter: RecipientFilter) => void;
  onSearch: () => void;
  loading: boolean;
}

export function RecipientFilterComponent({
  filter,
  onChange,
  onSearch,
  loading,
}: RecipientFilterProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [instructors, setInstructors] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);

  useEffect(() => {
    // Load initial data
    getLocations().then(setLocations);
    getTerms().then(setTerms);
    getInstructors().then((res) =>
      setInstructors(
        res.map((i) => ({
          id: i.id,
          firstName: i.firstName,
          lastName: i.lastName,
        })),
      ),
    );
  }, []);

  const handleChange = (
    key: keyof RecipientFilter,
    value: string | number | undefined,
  ) => {
    onChange({ ...filter, [key]: value === "all" ? undefined : value });
  };

  const allLevels = [
    ...PARENT_TOT_LEVELS,
    ...PRESCHOOL_LEVELS,
    ...SWIMMER_LEVELS,
    ...SWIMTEAM_LEVELS,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Filter Recipients</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Select
            value={filter.locationId || "all"}
            onValueChange={(v) => handleChange("locationId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Term</Label>
          <Select
            value={filter.termId || "all"}
            onValueChange={(v) => handleChange("termId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Level</Label>
          <Select
            value={filter.level || "all"}
            onValueChange={(v) => handleChange("level", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {allLevels.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Instructor</Label>
          <Select
            value={filter.instructorId || "all"}
            onValueChange={(v) => handleChange("instructorId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Instructors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instructors</SelectItem>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.firstName} {i.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Day of Week</Label>
          <Select
            value={
              filter.dayOfWeek !== undefined ? String(filter.dayOfWeek) : "all"
            }
            onValueChange={(v) =>
              handleChange("dayOfWeek", v === "all" ? undefined : Number(v))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any Day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Day</SelectItem>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="2">Tuesday</SelectItem>
              <SelectItem value="3">Wednesday</SelectItem>
              <SelectItem value="4">Thursday</SelectItem>
              <SelectItem value="5">Friday</SelectItem>
              <SelectItem value="6">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Start Time (after)</Label>
          <Input
            type="time"
            value={filter.startTime || ""}
            onChange={(e) => handleChange("startTime", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>End Time (before)</Label>
          <Input
            type="time"
            value={filter.endTime || ""}
            onChange={(e) => handleChange("endTime", e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button onClick={onSearch} disabled={loading} className="w-full">
            {loading ? "Searching..." : "Find Recipients"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

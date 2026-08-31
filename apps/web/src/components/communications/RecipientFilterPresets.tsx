"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getLocations, Location } from "@/lib/api/client/location";
import { getTerms, Term } from "@/lib/api/client/term";
import { getInstructors } from "@/lib/api/client/instructors";
import { getLevels, Level } from "@/lib/api/client/curriculum";
import {
  Recipient,
  RecipientFilter,
  getRecipients,
} from "@/lib/api/client/communications";

interface RecipientFilterPresetsProps {
  hasExistingRecipients: boolean;
  onSetRecipients: (recipients: Recipient[]) => void;
  onAppendRecipients: (recipients: Recipient[]) => void;
  setNotice: (
    notice: { type: "success" | "error" | "info"; message: string } | null,
  ) => void;
}

export function RecipientFilterPresets({
  hasExistingRecipients,
  onSetRecipients,
  onAppendRecipients,
  setNotice,
}: RecipientFilterPresetsProps) {
  const [filter, setFilter] = useState<RecipientFilter>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [instructors, setInstructors] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    getLocations().then(setLocations).catch(console.error);
    getTerms().then(setTerms).catch(console.error);
    getInstructors()
      .then((res) =>
        setInstructors(
          res.map((i) => ({
            id: i.id,
            firstName: i.firstName,
            lastName: i.lastName,
          })),
        ),
      )
      .catch(console.error);
    getLevels().then(setLevels).catch(console.error);
  }, []);

  const handleFilterChange = (
    key: keyof RecipientFilter,
    value: string | number | undefined,
  ) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const handleFetchFiltered = async (mode: "replace" | "append") => {
    try {
      setFilterLoading(true);
      setNotice(null);
      const res = await getRecipients(filter);
      if (res.length === 0) {
        setNotice({
          type: "info",
          message: "No recipients found matching the filter criteria.",
        });
        return;
      }

      if (mode === "replace") {
        onSetRecipients(res);
        setNotice({
          type: "success",
          message: `Loaded ${res.length} recipient(s) from filter.`,
        });
      } else {
        onAppendRecipients(res);
        setNotice({
          type: "success",
          message: `Appended ${res.length} recipient(s) to the list.`,
        });
      }
    } catch (e) {
      console.error(e);
      setNotice({
        type: "error",
        message: "Failed to fetch recipients for the given filter.",
      });
    } finally {
      setFilterLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Select
            value={filter.locationId || "all"}
            onValueChange={(v) => handleFilterChange("locationId", v)}
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
            onValueChange={(v) => handleFilterChange("termId", v)}
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
            onValueChange={(v) => handleFilterChange("level", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.name}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Instructor</Label>
          <Select
            value={filter.instructorId || "all"}
            onValueChange={(v) => handleFilterChange("instructorId", v)}
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
              handleFilterChange(
                "dayOfWeek",
                v === "all" ? undefined : Number(v),
              )
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
            onChange={(e) => handleFilterChange("startTime", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>End Time (before)</Label>
          <Input
            type="time"
            value={filter.endTime || ""}
            onChange={(e) => handleFilterChange("endTime", e.target.value)}
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            onClick={() => handleFetchFiltered("replace")}
            disabled={filterLoading}
            className="flex-1"
          >
            {filterLoading ? "Searching..." : "Find Recipients"}
          </Button>
          {hasExistingRecipients && (
            <Button
              variant="outline"
              onClick={() => handleFetchFiltered("append")}
              disabled={filterLoading}
              title="Append filtered guardians to current list"
            >
              + Append
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

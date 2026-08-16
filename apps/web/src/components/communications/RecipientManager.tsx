"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Recipient,
  RecipientFilter,
  getRecipients,
} from "@/lib/api/client/communications";
import { getLocations, Location } from "@/lib/api/client/location";
import { getTerms, Term } from "@/lib/api/client/term";
import { getInstructors } from "@/lib/api/client/instructors";
import { getLevels, Level } from "@/lib/api/client/curriculum";
import { searchGuardians, GuardianLite } from "@/lib/api/client/guardian";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  UserPlus,
  Mail,
  Trash2,
  X,
  Search,
  Users,
  Check,
  Plus,
  AlertCircle,
} from "lucide-react";

interface RecipientManagerProps {
  recipients: Recipient[];
  onAddRecipient: (recipient: Recipient) => void;
  onRemoveRecipient: (email: string) => void;
  onClearRecipients: () => void;
  onSetRecipients: (recipients: Recipient[]) => void;
  onAppendRecipients: (recipients: Recipient[]) => void;
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function RecipientManager({
  recipients,
  onAddRecipient,
  onRemoveRecipient,
  onClearRecipients,
  onSetRecipients,
  onAppendRecipients,
}: RecipientManagerProps) {
  // Filter state
  const [filter, setFilter] = useState<RecipientFilter>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [instructors, setInstructors] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);

  // Search guardian state
  const [guardianQuery, setGuardianQuery] = useState("");
  const debouncedGuardianQuery = useDebounced(guardianQuery, 300);
  const [guardianSearching, setGuardianSearching] = useState(false);
  const [guardianResults, setGuardianResults] = useState<GuardianLite[]>([]);
  const [guardianError, setGuardianError] = useState<string | null>(null);

  // Custom email state
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEmailError, setCustomEmailError] = useState<string | null>(null);

  // Search inside selected recipients
  const [listSearch, setListSearch] = useState("");

  // Notification / banner
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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

  // Guardian search effect
  useEffect(() => {
    let cancel = false;
    async function run() {
      if (!debouncedGuardianQuery.trim()) {
        setGuardianResults([]);
        return;
      }
      try {
        setGuardianError(null);
        setGuardianSearching(true);
        const items = await searchGuardians(debouncedGuardianQuery.trim());
        if (!cancel) setGuardianResults(items);
      } catch (e) {
        if (!cancel) {
          setGuardianError(
            e instanceof Error ? e.message : "Failed to search guardians",
          );
        }
      } finally {
        if (!cancel) setGuardianSearching(false);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [debouncedGuardianQuery]);

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

  const handleAddGuardian = (guardian: GuardianLite) => {
    if (!guardian.email) {
      setNotice({
        type: "error",
        message: `Guardian ${guardian.fullName} does not have an email address on file.`,
      });
      return;
    }

    const studentNames =
      guardian.students?.map((s) => `${s.firstName} ${s.lastName}`) || [];

    const newRecipient: Recipient = {
      id: guardian.id,
      name: guardian.fullName,
      email: guardian.email.trim(),
      students: studentNames,
    };

    onAddRecipient(newRecipient);
    setGuardianQuery("");
    setGuardianResults([]);
    setNotice({
      type: "success",
      message: `Added ${guardian.fullName} (${guardian.email}) to recipient list.`,
    });
  };

  const handleAddCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomEmailError(null);

    const email = customEmail.trim();
    if (!email) {
      setCustomEmailError("Email address is required.");
      return;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setCustomEmailError("Please enter a valid email address.");
      return;
    }

    const name = customName.trim() || email;
    const newRecipient: Recipient = {
      name,
      email,
      students: [],
    };

    onAddRecipient(newRecipient);
    setCustomEmail("");
    setCustomName("");
    setNotice({
      type: "success",
      message: `Added ${email} to recipient list.`,
    });
  };

  // Set of current recipient emails for quick duplicate check
  const recipientEmailSet = useMemo(() => {
    return new Set(recipients.map((r) => r.email.toLowerCase()));
  }, [recipients]);

  // Filtered recipient list for the selected recipients table
  const filteredList = useMemo(() => {
    if (!listSearch.trim()) return recipients;
    const q = listSearch.toLowerCase().trim();
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.students.some((s) => s.toLowerCase().includes(q)),
    );
  }, [recipients, listSearch]);

  return (
    <div className="space-y-6">
      {/* Top Card: Selection / Add Options */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                1. Select & Manage Recipients
              </CardTitle>
              <CardDescription>
                Use class filters for bulk selection, search specific guardians,
                or add custom emails directly.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit text-sm px-3 py-1">
              {recipients.length} Recipient{recipients.length === 1 ? "" : "s"}{" "}
              Selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice && (
            <div
              className={`flex items-center justify-between p-3 rounded-md text-sm ${
                notice.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : notice.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === "success" && <Check className="h-4 w-4" />}
                {notice.type === "error" && <AlertCircle className="h-4 w-4" />}
                {notice.type === "info" && <AlertCircle className="h-4 w-4" />}
                <span>{notice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Tabs defaultValue="filter" className="w-full">
            <div className="flex items-center mb-6 overflow-x-auto pb-1">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                <TabsTrigger
                  value="filter"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  <Filter className="h-4 w-4 shrink-0" />
                  <span>Filter Classes/Terms</span>
                </TabsTrigger>
                <TabsTrigger
                  value="guardian"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>Search Guardian/Student</span>
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>Add Custom Email</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Bulk Filters */}
            <TabsContent value="filter" className="space-y-4 pt-1">
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
                      filter.dayOfWeek !== undefined
                        ? String(filter.dayOfWeek)
                        : "all"
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
                    onChange={(e) =>
                      handleFilterChange("startTime", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Time (before)</Label>
                  <Input
                    type="time"
                    value={filter.endTime || ""}
                    onChange={(e) =>
                      handleFilterChange("endTime", e.target.value)
                    }
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
                  {recipients.length > 0 && (
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
            </TabsContent>

            {/* TAB 2: Search Guardian / Student */}
            <TabsContent value="guardian" className="space-y-4 pt-1">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={guardianQuery}
                    onChange={(e) => setGuardianQuery(e.target.value)}
                    placeholder="Search by guardian name, email, phone, or student name..."
                    className="pl-9"
                  />
                </div>

                {guardianSearching && (
                  <div className="text-xs text-muted-foreground py-2">
                    Searching guardians...
                  </div>
                )}
                {guardianError && (
                  <div className="text-xs text-red-600 py-1">
                    {guardianError}
                  </div>
                )}

                {guardianResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto bg-card shadow-sm">
                    {guardianResults.map((g) => {
                      const isAlreadyAdded = recipientEmailSet.has(
                        g.email?.toLowerCase(),
                      );
                      return (
                        <div
                          key={g.id}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {g.fullName}
                              {isAlreadyAdded && (
                                <Badge variant="secondary" className="text-xs">
                                  Already added
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{g.email || "No email"}</span>
                              {g.phone && <span>• {g.phone}</span>}
                            </div>
                            {g.students && g.students.length > 0 && (
                              <div className="text-xs text-slate-500">
                                Student(s):{" "}
                                {g.students
                                  .map((s) => `${s.firstName} ${s.lastName}`)
                                  .join(", ")}
                              </div>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant={isAlreadyAdded ? "secondary" : "default"}
                            disabled={!g.email || isAlreadyAdded}
                            onClick={() => handleAddGuardian(g)}
                            className="gap-1 ml-4 shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                            {isAlreadyAdded ? "Added" : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!guardianSearching &&
                  debouncedGuardianQuery.trim() &&
                  guardianResults.length === 0 && (
                    <div className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-slate-50">
                      No guardians found matching &quot;{debouncedGuardianQuery}&quot;.
                    </div>
                  )}
              </div>
            </TabsContent>

            {/* TAB 3: Add Custom Email */}
            <TabsContent value="custom" className="pt-1">
              <form onSubmit={handleAddCustomEmail} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-email">Email Address *</Label>
                    <Input
                      id="custom-email"
                      type="email"
                      placeholder="e.g. parent@example.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-name">Display Name (Optional)</Label>
                    <Input
                      id="custom-name"
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                </div>

                {customEmailError && (
                  <p className="text-xs text-red-600">{customEmailError}</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Email
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bottom Card: Selected Recipients Table / Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>Selected Recipients</span>
                <Badge variant="outline" className="font-semibold">
                  {recipients.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Review and manage people who will receive this email. Remove any
                unwanted recipients before sending.
              </CardDescription>
            </div>

            {recipients.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Filter list..."
                    className="h-8 pl-9 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearRecipients}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {recipients.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50/50">
              <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                No recipients selected yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Filter by class/term above, search for specific guardians, or
                type custom email addresses to populate this list.
              </p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto divide-y">
                {filteredList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No recipients match &quot;{listSearch}&quot;.
                  </div>
                ) : (
                  filteredList.map((r) => (
                    <div
                      key={r.email}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-sm"
                    >
                      <div className="space-y-0.5 min-w-0 pr-4">
                        <div className="font-medium text-slate-900 truncate">
                          {r.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate">
                          {r.email}
                        </div>
                        {r.students && r.students.length > 0 && (
                          <div className="text-xs text-slate-400 mt-1 truncate">
                            Student(s): {r.students.join(", ")}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveRecipient(r.email)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        title={`Remove ${r.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove recipient</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-slate-50 px-4 py-2 text-xs text-muted-foreground flex justify-between border-t">
                <span>
                  Showing {filteredList.length} of {recipients.length} recipients
                </span>
                {listSearch && (
                  <button
                    onClick={() => setListSearch("")}
                    className="text-primary hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

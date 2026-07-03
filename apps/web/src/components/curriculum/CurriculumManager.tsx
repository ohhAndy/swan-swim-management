"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  createSkill,
  updateSkill,
  deleteSkill,
  Level,
  Skill,
} from "@/lib/api/client/curriculum";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function CurriculumManager() {
  const queryClient = useQueryClient();
  const { data: levelsData, isLoading } = useQuery({
    queryKey: ["levels"],
    queryFn: getLevels,
  });

  const levels = levelsData || [];
  const loading = isLoading;

  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>(
    {},
  );

  // Level Dialog State
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelForm, setLevelForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    order: 0,
  });
  const [isSubmittingLevel, setIsSubmittingLevel] = useState(false);

  // Skill Dialog State
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState({ description: "", order: 0 });
  const [isSubmittingSkill, setIsSubmittingSkill] = useState(false);


  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => ({ ...prev, [levelId]: !prev[levelId] }));
  };

  // --- Level Handlers ---

  const openAddLevel = () => {
    setEditingLevel(null);
    setLevelForm({
      name: "",
      description: "",
      color: "#3b82f6",
      order: levels.length,
    });
    setIsLevelDialogOpen(true);
  };

  const openEditLevel = (level: Level, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLevel(level);
    setLevelForm({
      name: level.name,
      description: level.description || "",
      color: level.color || "#3b82f6",
      order: level.order,
    });
    setIsLevelDialogOpen(true);
  };

  const handleLevelSubmit = async () => {
    setIsSubmittingLevel(true);
    try {
      if (editingLevel) {
        await updateLevel(editingLevel.id, levelForm);
      } else {
        await createLevel(levelForm);
      }
      queryClient.invalidateQueries({ queryKey: ["levels"] });
      setIsLevelDialogOpen(false);
    } catch (error) {
      console.error("Failed to save level", error);
      alert("Failed to save level");
    } finally {
      setIsSubmittingLevel(false);
    }
  };

  const handleDeleteLevel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this level? All associated skills will also be removed.",
      )
    )
      return;
    try {
      await deleteLevel(id);
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    } catch (error) {
      console.error("Failed to delete level", error);
    }
  };

  // --- Skill Handlers ---

  const openAddSkill = (levelId: string) => {
    setSelectedLevelId(levelId);
    setEditingSkill(null);
    // Default order is end of list
    const level = levels.find((l) => l.id === levelId);
    const order = level ? level.skills.length : 0;
    setSkillForm({ description: "", order });
    setIsSkillDialogOpen(true);
  };

  const openEditSkill = (skill: Skill, levelId: string) => {
    setSelectedLevelId(levelId);
    setEditingSkill(skill);
    setSkillForm({ description: skill.description, order: skill.order });
    setIsSkillDialogOpen(true);
  };

  const handleSkillSubmit = async () => {
    if (!selectedLevelId) return;
    setIsSubmittingSkill(true);
    try {
      if (editingSkill) {
        await updateSkill(editingSkill.id, skillForm);
      } else {
        await createSkill({ ...skillForm, levelId: selectedLevelId });
      }
      queryClient.invalidateQueries({ queryKey: ["levels"] }); // Refresh to show new skill
      setIsSkillDialogOpen(false);
    } catch (error) {
      console.error("Failed to save skill", error);
      alert("Failed to save skill");
    } finally {
      setIsSubmittingSkill(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Delete this skill?")) return;
    try {
      await deleteSkill(id);
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    } catch (error) {
      console.error("Failed to delete skill", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Curriculum</h2>
          <p className="text-muted-foreground">
            Manage swimming levels and skills for report cards.
          </p>
        </div>
        <Button onClick={openAddLevel}>
          <Plus className="mr-2 h-4 w-4" /> Add Level
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : levels.length === 0 ? (
          <div className="text-center p-8 border rounded-lg text-muted-foreground border-dashed">
            No levels defined yet. Create your first level to get started.
          </div>
        ) : (
          levels.map((level) => (
            <Card key={level.id} className="overflow-hidden">
              <div
                className="p-4 flex items-center justify-between bg-card cursor-pointer hover:bg-muted/50 transition-colors border-b"
                onClick={() => toggleLevel(level.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedLevels[level.id] ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div
                    className="w-4 h-4 rounded-full border shadow-sm"
                    style={{ backgroundColor: level.color || "#3b82f6" }}
                  />
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {level.name}
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Order: {level.order}
                      </span>
                    </h3>
                    {level.description && (
                      <p className="text-sm text-muted-foreground">
                        {level.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => openEditLevel(level, e)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => handleDeleteLevel(level.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expandedLevels[level.id] && (
                <CardContent className="p-0 bg-muted/10">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Skills
                        <span className="bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                          {level.skills.length}
                        </span>
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddSkill(level.id)}
                      >
                        <Plus className="mr-2 h-3 w-3" /> Add Skill
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {level.skills.length === 0 ? (
                        <li className="text-sm text-muted-foreground italic text-center p-4">
                          No skills added yet.
                        </li>
                      ) : (
                        level.skills.map((skill) => (
                          <li
                            key={skill.id}
                            className="flex justify-between items-center p-3 rounded-md bg-background border hover:border-primary/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                                {skill.order}
                              </span>
                              <span className="text-sm font-medium">
                                {skill.description}
                              </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditSkill(skill, level.id)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteSkill(skill.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Level Dialog */}
      <Dialog open={isLevelDialogOpen} onOpenChange={setIsLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLevel ? "Edit Level" : "Add Level"}
            </DialogTitle>
            <DialogDescription>
              {editingLevel
                ? "Update level details."
                : "Create a new swimming level."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={levelForm.name}
                onChange={(e) =>
                  setLevelForm({ ...levelForm, name: e.target.value })
                }
                placeholder="e.g. Level 1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={levelForm.description}
                onChange={(e) =>
                  setLevelForm({ ...levelForm, description: e.target.value })
                }
                placeholder="Brief description of the level"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={levelForm.color}
                    onChange={(e) =>
                      setLevelForm({ ...levelForm, color: e.target.value })
                    }
                    className="w-12 p-1 h-10"
                  />
                  <Input
                    value={levelForm.color}
                    onChange={(e) =>
                      setLevelForm({ ...levelForm, color: e.target.value })
                    }
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={levelForm.order}
                  onChange={(e) =>
                    setLevelForm({
                      ...levelForm,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLevelDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleLevelSubmit} disabled={isSubmittingLevel}>
              {isSubmittingLevel && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Skill Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "Edit Skill" : "Add Skill"}
            </DialogTitle>
            <DialogDescription>
              Define a skill required for this level.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="skill-desc">Description</Label>
              <Textarea
                id="skill-desc"
                value={skillForm.description}
                onChange={(e) =>
                  setSkillForm({ ...skillForm, description: e.target.value })
                }
                placeholder="e.g. Submerge face for 5 seconds"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-order">Order</Label>
              <Input
                id="skill-order"
                type="number"
                value={skillForm.order}
                onChange={(e) =>
                  setSkillForm({
                    ...skillForm,
                    order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSkillDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSkillSubmit} disabled={isSubmittingSkill}>
              {isSubmittingSkill && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

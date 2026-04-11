"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DurationPicker } from "@/components/space/duration-picker";
import { useCreateSpace } from "@/hooks/use-space";
import { spaceNameSchema } from "@/lib/schemas/space.schema";
import { Save, Lock } from "lucide-react";

export function SpaceEditor() {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState(60);
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const router = useRouter();
  const createSpace = useCreateSpace();

  function validateName(value: string) {
    const result = spaceNameSchema.safeParse(value);
    if (!result.success) {
      setNameError(result.error.issues[0].message);
    } else {
      setNameError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameResult = spaceNameSchema.safeParse(name);
    if (!nameResult.success) {
      setNameError(nameResult.error.issues[0].message);
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    try {
      await createSpace.mutateAsync({
        name,
        content,
        duration,
        password: password || undefined,
      });
      toast.success("Space created!");
      router.push(`/space/${name.toLowerCase()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create space";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="space-name">Space Name</Label>
        <Input
          id="space-name"
          placeholder="my-clipboard"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value) validateName(e.target.value);
          }}
          onBlur={() => { if (name) validateName(name); }}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="space-content">Content</Label>
        <Textarea
          id="space-content"
          placeholder="Paste your text here..."
          className="min-h-[200px] font-mono"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Expires In</Label>
          <DurationPicker value={duration} onChange={setDuration} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="space-password">Password (optional)</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="space-password"
              type="password"
              placeholder="Optional"
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={createSpace.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {createSpace.isPending ? "Creating..." : "Create Space"}
        </Button>
      </div>
    </form>
  );
}

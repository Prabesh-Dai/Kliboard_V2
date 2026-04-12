"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSpace } from "@/hooks/use-space";
import { spaceNameSchema } from "@/lib/schemas/space.schema";

export function SpaceEditor() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const router = useRouter();
  const createSpace = useCreateSpace();

  function validateName(value: string) {
    const result = spaceNameSchema.safeParse(value);
    setNameError(result.success ? "" : result.error.issues[0].message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = spaceNameSchema.safeParse(name);
    if (!result.success) {
      setNameError(result.error.issues[0].message);
      return;
    }

    const target = `/space/${name.toLowerCase()}`;
    try {
      await createSpace.mutateAsync({ name, duration: 5 });
      router.push(target);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create space";
      if (message === "A space with this name already exists") {
        router.push(target);
      } else {
        toast.error(message);
      }
    }
  }

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="flex">
        <Input
          placeholder="space_name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value) validateName(e.target.value);
          }}
          className="h-12 rounded-r-none border-r-0 bg-card font-mono text-base"
        />
        <Button
          type="submit"
          disabled={createSpace.isPending}
          className="h-12 rounded-l-none px-6 font-mono text-xs uppercase tracking-widest"
        >
          {createSpace.isPending ? "..." : "enter_space"}
        </Button>
      </form>
      {nameError && (
        <p className="mt-2 font-mono text-xs text-destructive">{nameError}</p>
      )}
    </div>
  );
}

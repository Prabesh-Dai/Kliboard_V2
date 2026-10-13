"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/shared/password-input";
import { MIN_SPACE_PASSWORD_LENGTH } from "@/lib/constants";

interface SetPasswordDialogProps {
  open: boolean;
  mode?: "set" | "rotate";
  onSubmit: (password: string) => void;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
}

export function SetPasswordDialog({
  open,
  mode = "set",
  onSubmit,
  onCancel,
  error,
  loading,
}: SetPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <SetPasswordForm mode={mode} onSubmit={onSubmit} error={error} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}

function SetPasswordForm({
  mode,
  onSubmit,
  error,
  loading,
}: Pick<SetPasswordDialogProps, "mode" | "onSubmit" | "error" | "loading">) {
  const [password, setPassword] = useState("");
  const valid = password.length >= MIN_SPACE_PASSWORD_LENGTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (valid && !loading) onSubmit(password);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{mode === "rotate" ? "New password" : "Make it private"}</DialogTitle>
        <DialogDescription>
          {mode === "rotate"
            ? "The old password stops working."
            : "People will need this password to open it."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <PasswordInput
            aria-label="Password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <p className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
            {error ?? `${MIN_SPACE_PASSWORD_LENGTH}+ characters`}
          </p>
        </div>
        <Button type="submit" className="h-10 w-full" disabled={!valid || loading}>
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          {loading ? "Saving..." : mode === "rotate" ? "Save" : "Make private"}
        </Button>
      </form>
    </>
  );
}

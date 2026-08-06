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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";
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
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const tooShort = password.length > 0 && password.length < MIN_SPACE_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && password !== confirm;
  const valid = password.length >= MIN_SPACE_PASSWORD_LENGTH && password === confirm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (valid && !loading) onSubmit(password);
  }

  function handleCancel() {
    setPassword("");
    setConfirm("");
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            {mode === "rotate" ? "Change Space Password" : "Set Space Password"}
          </DialogTitle>
          <DialogDescription>
            {mode === "rotate"
              ? "Anyone still holding the old password will be signed out of this space."
              : "This space becomes private. Only you and people you give the password to can open it."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-password">Password</Label>
            <Input
              id="set-password"
              type="password"
              autoComplete="new-password"
              placeholder={`Min ${MIN_SPACE_PASSWORD_LENGTH} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {tooShort && (
              <p className="text-sm text-destructive">
                Password must be at least {MIN_SPACE_PASSWORD_LENGTH} characters
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {mismatch && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!valid || loading}>
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              {loading
                ? "Saving..."
                : mode === "rotate"
                  ? "Change password"
                  : "Make private"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

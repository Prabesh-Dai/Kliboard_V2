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
import { KeyRound, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { MIN_SPACE_PASSWORD_LENGTH } from "@/lib/constants";
import { generatePassphrase, scorePassword } from "@/lib/password-strength";

interface SetPasswordDialogProps {
  open: boolean;
  mode?: "set" | "rotate";
  onSubmit: (password: string) => void;
  onCancel: () => void;
  error?: string;
  loading?: boolean;
  busyLabel?: string;
}

export function SetPasswordDialog({
  open,
  mode = "set",
  onSubmit,
  onCancel,
  error,
  loading,
  busyLabel,
}: SetPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [revealed, setRevealed] = useState(false);

  const strength = scorePassword(password);
  const mismatch = confirm.length > 0 && password !== confirm;
  const valid = strength.acceptable && password === confirm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (valid && !loading) onSubmit(password);
  }

  function handleCancel() {
    setPassword("");
    setConfirm("");
    setRevealed(false);
    onCancel();
  }

  function handleGenerate() {
    const generated = generatePassphrase();
    setPassword(generated);
    setConfirm(generated);
    setRevealed(true);
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
              ? "Anyone still holding the old password loses access. Your content is re-keyed, not re-encrypted."
              : "This space becomes private and its contents are encrypted in your browser before they are sent."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-sm bg-surface-container-high p-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            The server never sees this password, so it cannot reset it. Lose the
            password and the contents are gone for good.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="set-password">Password</Label>
              <button
                type="button"
                onClick={handleGenerate}
                className="flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <Sparkles className="size-3" />
                Generate
              </button>
            </div>
            <Input
              id="set-password"
              type={revealed ? "text" : "password"}
              autoComplete="new-password"
              placeholder={`Min ${MIN_SPACE_PASSWORD_LENGTH} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={`h-1 flex-1 rounded-sm transition-colors ${
                        strength.score >= step
                          ? strength.acceptable
                            ? "bg-primary"
                            : "bg-destructive"
                          : "bg-surface-container-high"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs ${
                    strength.acceptable ? "text-muted-foreground" : "text-destructive"
                  }`}
                >
                  {strength.label}
                  {strength.hint ? ` — ${strength.hint}` : ""}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type={revealed ? "text" : "password"}
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
                ? (busyLabel ?? "Saving...")
                : mode === "rotate"
                  ? "Change password"
                  : "Encrypt & make private"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

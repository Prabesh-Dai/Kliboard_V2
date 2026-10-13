"use client";

import { useState } from "react";
import NextLink from "next/link";
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

interface SpacePasswordDialogProps {
  open: boolean;
  spaceName: string;
  onSubmit: (password: string) => void;
  error?: string;
  loading?: boolean;
}

export function SpacePasswordDialog({
  open,
  spaceName,
  onSubmit,
  error,
  loading,
}: SpacePasswordDialogProps) {
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password && !loading) onSubmit(password);
  }

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="truncate">{spaceName}</DialogTitle>
          <DialogDescription>This space is private.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <PasswordInput
              aria-label="Password"
              aria-invalid={Boolean(error)}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="h-10 w-full" disabled={!password || loading}>
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {loading ? "Opening..." : "Open"}
          </Button>
        </form>
        <NextLink
          href="/"
          className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to home
        </NextLink>
      </DialogContent>
    </Dialog>
  );
}

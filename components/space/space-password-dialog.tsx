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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2 } from "lucide-react";

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
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{spaceName}</span> is a
            private space. Enter its password to view the contents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="space-password">Password</Label>
            <Input
              id="space-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter space password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={!password || loading}>
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {loading ? "Verifying..." : "Unlock"}
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

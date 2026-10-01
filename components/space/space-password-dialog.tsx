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
  encrypted?: boolean;
  ownerView?: boolean;
}

export function SpacePasswordDialog({
  open,
  spaceName,
  onSubmit,
  error,
  loading,
  encrypted,
  ownerView,
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
            {ownerView ? "Unlock Your Space" : "Password Required"}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{spaceName}</span>{" "}
            {encrypted
              ? "is encrypted. Its password is the decryption key, so it is needed even if you own the space."
              : "is a private space. Enter its password to view the contents."}
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
            {loading ? (encrypted ? "Decrypting..." : "Verifying...") : "Unlock"}
          </Button>
        </form>
        {encrypted && (
          <p className="text-center text-[11px] text-muted-foreground">
            Unlocking runs entirely in your browser and can take a moment.
          </p>
        )}
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

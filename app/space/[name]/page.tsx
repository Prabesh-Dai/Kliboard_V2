"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSpace } from "@/hooks/use-space";
import { useAuth } from "@/hooks/use-auth";
import { SpaceViewer } from "@/components/space/space-viewer";
import { SpacePasswordDialog } from "@/components/space/space-password-dialog";
import { FileUpload } from "@/components/space/file-upload";
import { FileList } from "@/components/space/file-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

export default function SpacePage() {
  const { name } = useParams<{ name: string }>();
  const [password, setPassword] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState("");
  const { user } = useAuth();
  const { data: space, isLoading, error } = useSpace(name, password);

  const isPasswordProtected =
    error && (error as Error & { passwordProtected?: boolean }).passwordProtected;

  function handlePasswordSubmit(pw: string) {
    setPasswordError("");
    setPassword(pw);
  }

  if (isPasswordProtected && !space) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <SpacePasswordDialog
          open={true}
          onSubmit={handlePasswordSubmit}
          error={password ? "Invalid password" : passwordError}
          loading={isLoading}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold">Space Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This space doesn&apos;t exist or has expired.
        </p>
      </div>
    );
  }

  const isOwner = Boolean(user && space.owner_id === user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{space.name}</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <SpaceViewer space={space} />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Files</h3>
          <FileUpload spaceName={space.name} spaceId={space.id} />
          <Separator />
          <FileList spaceName={space.name} isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
}

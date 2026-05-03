"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { SpacePageContent } from "@/components/space/space-page-content";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, baseTransition } from "@/lib/animations";

export default function AdminSpacePage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/admin");
      const data = await res.json();
      return data.isAdmin as boolean;
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, authLoading, isAdmin, adminLoading, router]);

  if (authLoading || adminLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Skeleton className="mb-6 h-5 w-48" />
        <Skeleton className="mb-8 h-9 w-64" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={baseTransition}
          className="flex items-center gap-3"
        >
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Admin
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">Editing as admin</span>
          </div>
        </motion.div>
      </div>
      <SpacePageContent name={name} isAdmin />
    </>
  );
}

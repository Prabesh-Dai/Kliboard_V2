"use client";

import { useParams } from "next/navigation";
import { SpacePageContent } from "@/components/space/space-page-content";

export default function SpacePage() {
  const { name } = useParams<{ name: string }>();
  return <SpacePageContent name={name} />;
}

import { SpaceEditor } from "@/components/space/space-editor";
import { RecentSpacesGrid } from "@/components/shared/recent-spaces-grid";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Kliboard</h1>
        <p className="mt-2 text-muted-foreground">
          Temporary text clipboard. Create, share, auto-expire.
        </p>
      </div>

      <SpaceEditor />

      <Separator className="my-10" />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Spaces</h2>
        <RecentSpacesGrid />
      </div>
    </div>
  );
}

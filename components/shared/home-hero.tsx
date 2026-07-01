import { SpaceEditor } from "@/components/space/space-editor";
import { RecentSpacesGrid } from "@/components/shared/recent-spaces-grid";

export function HomeHero() {
  return (
    <div className="flex min-h-full flex-col items-center px-6 pt-24 sm:pt-[18vh]">
      <h2 className="animate-enter animate-enter-1 mb-4 text-center font-heading text-4xl font-medium tracking-tight sm:text-5xl">
        create a new space
      </h2>

      <div className="animate-enter animate-enter-2 w-full max-w-lg">
        <SpaceEditor />
      </div>

      <div className="animate-enter animate-enter-3 mt-28 w-full max-w-3xl pb-16">
        <p className="mb-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          recently visited
        </p>
        <RecentSpacesGrid />
      </div>
    </div>
  );
}

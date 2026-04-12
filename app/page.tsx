import { SpaceEditor } from "@/components/space/space-editor";
import { RecentSpacesGrid } from "@/components/shared/recent-spaces-grid";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-center text-4xl font-extralight tracking-wide sm:text-5xl">
        enter a space name
      </h1>
      <p className="mb-12 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        temporary, anonymous storage
      </p>

      <SpaceEditor />

      <div className="mt-24 w-full max-w-3xl">
        <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          recently visited
        </p>
        <RecentSpacesGrid />
      </div>
    </div>
  );
}

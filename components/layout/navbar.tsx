"use client";

import Link from "next/link";
import { Clipboard, LogIn, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Clipboard className="h-5 w-5" />
          Kliboard
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading && (
            <>
              {user ? (
                <>
                  <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

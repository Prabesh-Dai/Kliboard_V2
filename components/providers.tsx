"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MotionConfig reducedMotion={process.env.NODE_ENV === "production" ? "user" : "never"}>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-center" offset={16} />
          </TooltipProvider>
        </MotionConfig>
      </AuthProvider>
    </QueryClientProvider>
  );
}

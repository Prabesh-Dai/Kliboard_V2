"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { AnonClaimRunner } from "@/components/anon-claim-runner";

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
            <AnonClaimRunner />
            {children}
            <Toaster
              position="top-right"
              offset={{
                top: "calc(env(safe-area-inset-top) + 4.25rem)",
                right: "max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))",
              }}
              mobileOffset={{
                top: "calc(env(safe-area-inset-top) + 4.25rem)",
                right: "1.5rem",
                left: "1.5rem",
              }}
            />
          </TooltipProvider>
        </MotionConfig>
      </AuthProvider>
    </QueryClientProvider>
  );
}

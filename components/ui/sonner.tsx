"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={5000}
      closeButton
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--surface-container-low)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--ghost-border)",
          "--success-bg": "var(--surface-container-low)",
          "--success-text": "var(--primary)",
          "--success-border": "color-mix(in oklab, var(--primary) 30%, transparent)",
          "--warning-bg": "var(--surface-container-low)",
          "--warning-text": "var(--warning)",
          "--warning-border": "color-mix(in oklab, var(--warning) 30%, transparent)",
          "--error-bg": "var(--surface-container-low)",
          "--error-text": "var(--destructive)",
          "--error-border": "color-mix(in oklab, var(--destructive) 30%, transparent)",
          "--border-radius": "var(--radius-md)",
          "--width": "min(24rem, calc(100vw - 3rem))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-[0px_8px_24px_rgba(0,0,0,0.25)] text-sm font-heading font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

import { createElement } from "react";
import type { IconNode } from "lucide-react";

// lucide-react components call hooks, which next/og can't run, so draw the raw icon nodes instead
export function LucideIcon({
  node,
  size,
  color,
  strokeWidth = 2,
}: {
  node: IconNode;
  size: number;
  color: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {node.map(([tag, attrs], i) => createElement(tag, { ...attrs, key: i }))}
    </svg>
  );
}

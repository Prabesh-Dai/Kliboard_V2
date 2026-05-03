import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "motion",
      "@base-ui/react",
      "date-fns",
      "react-markdown",
      "sonner",
    ],
  },
};

export default nextConfig;

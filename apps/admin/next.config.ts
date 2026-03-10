import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@perrologo/db", "@perrologo/domain"],
  outputFileTracingRoot: path.join(currentDir, "../../")
};

export default nextConfig;

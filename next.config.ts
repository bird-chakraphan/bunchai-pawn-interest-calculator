import type { NextConfig } from "next"
import { assertLocalTestConfiguration } from "./lib/local-test-config"

assertLocalTestConfiguration(process.env)

const nextConfig: NextConfig = {}

export default nextConfig

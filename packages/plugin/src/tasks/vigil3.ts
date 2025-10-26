// src/tasks/vigil3.ts
import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { runSlither } from "../slither-runner.js"

interface Vigil3TaskArguments {
  files: string;
}

export default async function (
  args: Vigil3TaskArguments,
  hre: HardhatRuntimeEnvironment
) {

  const raw = args.files?.trim() || "contracts";

  const files = raw.split(/\s+|,/).filter(Boolean);

  console.log(`[vigil3] Running Slither analysis on ${files.length} target(s):`);
  for (const file of files) {
    console.log(`  → ${file}`);

    try {
      const reportPath = await runSlither(file);
      console.log(`[vigil3] ✅ Report generated for ${file}: ${reportPath}`);
    } catch (err: any) {
      console.error(`[vigil3] ❌ Slither failed for ${file}: ${err.message}`);
    }
  }

  console.log("[vigil3] All analyses completed.");
}

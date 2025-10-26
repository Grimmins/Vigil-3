// src/tasks/vigil3.ts
import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { runSlither } from "../slither-runner.js"

interface Vigil3TaskArguments {
  file: string;
}

export default async function (
  args: Vigil3TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  const file = args.file ?? "contracts";
  console.log(`[vigil3] Running Slither analysis on: ${file}`);
  const reportPath = await runSlither(file);
  console.log(`[vigil3] Slither report generated: ${reportPath}`);
}

// src/tasks/vigil3.ts
import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { runSlither } from "../slither-runner.js"

interface Vigil3TaskArguments {
  file: string;
}

export default async function (
  args: Vigil3TaskArguments,
  hre: HardhatRuntimeEnvironment,
  runSuper?: Function
) {

  if (typeof runSuper === "function") {
    await runSuper(args);
  }

  const file = args.file ?? "contracts";
  console.log(`[vigil3] Running Slither analysis on: ${file}`);

  try {
    const reportPath = await runSlither(file);
    console.log(`[vigil3] ✅ Slither report generated: ${reportPath}`);
  } catch (err: any) {
    console.error(`[vigil3] ❌ Slither failed for ${file}:`, err.message);
    throw err;
  }
}

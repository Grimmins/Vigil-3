// src/tasks/compile.ts
/*import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { enforceVulnerabilitiesGuard } from "../guard.js";

export default async function (
  args: any,
  hre: HardhatRuntimeEnvironment,
  runSuper?: Function
) {
  if (typeof runSuper === "function") {
    await runSuper(args);
  }
  await enforceVulnerabilitiesGuard(process.cwd(), hre.config);
}*/
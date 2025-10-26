import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { getSlitherBinaryPath } from "./binaries.js";

/**
 * Run Slither on a single Solidity file.
 * Each run generates its own distinct JSON report.
 *
 * Example output: slither-Counter_sol.json
 */
export async function runSlither(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  const slitherPath = await getSlitherBinaryPath();

  // Génère un nom de fichier propre (Counter.sol → slither-Counter_sol.json)
  const sanitizedName = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, "_");
  const outputFile = path.join(process.cwd(), `slither-${sanitizedName}.json`);

  // Supprime un ancien rapport s’il existe (pour permettre la réécriture)
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  console.log("\x1b[36m%s\x1b[0m", `[vigil3] Analyzing contract: ${absolutePath}`);

  // Exécute Slither
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(slitherPath, [absolutePath, "--json", outputFile], {
      stdio: "inherit",
    });

    proc.on("error", (err) => {
      console.error("\x1b[31m[vigil3] Slither execution failed\x1b[0m");
      reject(err);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`[vigil3] Slither exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });

  if (!fs.existsSync(outputFile)) {
    throw new Error(`[vigil3] Slither did not generate a report for ${filePath}`);
  }

  console.log("\x1b[32m%s\x1b[0m", `[vigil3] Report generated: ${outputFile}`);
  return outputFile;
}

/**
 * Read a Slither JSON report and parse its content.
 */
export function readSlitherReport(filePath: string): any {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

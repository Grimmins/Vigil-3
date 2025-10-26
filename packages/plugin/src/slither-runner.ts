import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { getSlitherBinaryPath } from "./binaries.js";

/**
 * Run Slither on one or several Solidity files.
 * If a directory (e.g. "contracts") is given, analyzes every .sol file inside it.
 *
 * All results are merged into a single JSON report (like compile output).
 * Output: slither-report.json
 */
export async function runSlither(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  const slitherPath = await getSlitherBinaryPath();

  const stats = fs.statSync(absolutePath);
  const reports: string[] = [];

  if (stats.isDirectory()) {
    const allFiles = collectSolidityFiles(absolutePath);
    if (allFiles.length === 0) {
      throw new Error(`[vigil3] No Solidity files found in ${absolutePath}`);
    }

    console.log(
      `\x1b[36m[vigil3] Found ${allFiles.length} Solidity file(s) in ${filePath}\x1b[0m`
    );

    for (const file of allFiles) {
      const [reportPath] = await analyzeSingleFile(slitherPath, file);
      reports.push(reportPath);
    }
  } else {
    const [reportPath] = await analyzeSingleFile(slitherPath, absolutePath);
    reports.push(reportPath);
  }

  // Combine all JSON reports into one single file (for guard.ts)
  const mergedReportPath = path.join(process.cwd(), "slither-report.json");
  const mergedData: any[] = [];

  for (const report of reports) {
    try {
      const data = readSlitherReport(report);
      mergedData.push(data);
    } catch (err: any) {
      console.warn(`[vigil3] ⚠️ Could not parse report ${report}: ${err.message}`);
    }
  }

  fs.writeFileSync(mergedReportPath, JSON.stringify(mergedData, null, 2), "utf8");
  console.log("\x1b[32m%s\x1b[0m", `[vigil3] Combined report generated: ${mergedReportPath}`);

  return mergedReportPath;
}

/**
 * Analyse un fichier unique et génère un rapport JSON distinct.
 */
async function analyzeSingleFile(
  slitherPath: string,
  absolutePath: string
): Promise<string[]> {
  const sanitizedName = path.basename(absolutePath).replace(/[^a-zA-Z0-9._-]/g, "_");
  const outputFile = path.join(process.cwd(), `slither-${sanitizedName}.json`);

  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  console.log("\x1b[36m%s\x1b[0m", `[vigil3] Analyzing contract: ${absolutePath}`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(slitherPath, [absolutePath, "--json", outputFile], {
      stdio: "inherit",
    });

    proc.on("error", (err) => {
      console.error("\x1b[31m[vigil3] Slither execution failed\x1b[0m");
      reject(err);
    });

    proc.on("close", (code) => {
      if (code !== 0 && code !== 255) {
        reject(new Error(`[vigil3] Slither exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });

  if (!fs.existsSync(outputFile)) {
    throw new Error(`[vigil3] Slither did not generate a report for ${absolutePath}`);
  }

  console.log("\x1b[32m%s\x1b[0m", `[vigil3] Report generated: ${outputFile}`);
  return [outputFile];
}

/**
 * Récupère récursivement tous les fichiers .sol dans un dossier.
 */
function collectSolidityFiles(dir: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      results.push(...collectSolidityFiles(fullPath));
    } else if (stats.isFile() && fullPath.endsWith(".sol")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Read and parse a Slither JSON report.
 */
export function readSlitherReport(filePath: string): any {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

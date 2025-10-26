import { readSlitherReport, runSlither } from "./slither-runner.js";
import * as fs from "fs";
import * as path from "path";

type Severity = "High" | "Medium" | "Low" | "Informational" | "Optimization";

interface Finding {
  check: string;
  impact: Severity;
  description: string;
}

interface ContractResult {
  file: string;
  findings: Finding[];
}

function color(text: string, colorCode: string): string {
  const codes: Record<string, string> = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
  };
  return `${codes[colorCode] || ""}${text}${codes.reset}`;
}

/**
 * Run Slither on all contracts and summarize results.
 * Block deployment if High/Medium issues are found (depending on config).
 */
export async function enforceVulnerabilitiesGuard(projectRoot: string, cfg: any) {
  const blockOn: Severity[] = cfg?.vigil3?.blockOnSeverities ?? ["High", "Medium"];

  const contractsDir = path.join(projectRoot, "contracts");
  if (!fs.existsSync(contractsDir)) return;

  const solidityFiles = fs
    .readdirSync(contractsDir)
    .filter(f => f.endsWith(".sol") && !f.endsWith(".t.sol"))
    .map(f => path.join(contractsDir, f));

  console.log(color(`[vigil3] Analyzing ${solidityFiles.length} contracts...\n`, "cyan"));

  const results: ContractResult[] = [];
  const blockedContracts: ContractResult[] = [];

  for (const file of solidityFiles) {
    const reportPath = await runSlither(file);
    const report = readSlitherReport(reportPath);
    const findings: Finding[] = (report?.results?.detectors ?? []) || [];

    results.push({ file, findings });

    const hasBlocking = findings.some(f => blockOn.includes(f.impact));
    const shortName = path.basename(file);

    if (findings.length === 0) {
      console.log(`${color("✅", "green")} ${shortName.padEnd(25)} SAFE (0 issues)`);
      continue;
    }

    const highCount = findings.filter(f => f.impact === "High").length;
    const medCount = findings.filter(f => f.impact === "Medium").length;
    const lowCount = findings.filter(f => f.impact === "Low").length;
    const infoCount = findings.filter(f => f.impact === "Informational").length;

    const impactLabel =
      highCount > 0
        ? color("BLOCKED", "red")
        : medCount > 0
        ? color("WARNING", "yellow")
        : color("SAFE*", "green");

    console.log(
      `${hasBlocking ? "❌" : "⚠️ "} ${shortName.padEnd(25)} ${impactLabel} (${findings.length} issues)`
    );

    // Si bloquant, affiche un résumé court des vulnérabilités majeures
    if (hasBlocking) {
      const majorFindings = findings.filter(f => blockOn.includes(f.impact));
      majorFindings.slice(0, 3).forEach(f =>
        console.log(
          `   - [${f.impact}] ${f.check}: ${f.description.substring(0, 60)}...`
        )
      );
      blockedContracts.push({ file, findings: majorFindings });
    }
  }

  console.log("\n");

  if (blockedContracts.length > 0) {
    console.error(color("[vigil3] Deployment blocked due to vulnerabilities:\n", "red"));
    blockedContracts.forEach(b =>
      console.error(` - ${path.basename(b.file)} (${b.findings.length} critical findings)`)
    );
    throw new Error("[vigil3] Deployment blocked due to Slither findings");
  } else {
    console.log(color("[vigil3] ✅ All contracts passed security checks.\n", "green"));
  }
}

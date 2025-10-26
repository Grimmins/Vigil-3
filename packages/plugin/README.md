# hardhat-vigil3

Hardhat plugin to analyze Solidity contracts with **Slither** and block deployments when vulnerabilities are found.

## Installation

In an existing Hardhat project:

```bash
npm install --save-dev hardhat vigil3
```

During installation, the plugin automatically downloads a **Slither** binary for your OS (Linux, macOS, or Windows).

## Configuration

In your `hardhat.config.ts`:

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "vigil3";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  vigil3: {
    // Severity levels that block compile/deploy
    // Valid values: "High" | "Medium" | "Low" | "Informational" | "Optimization"
    blockOnSeverities: ["High", "Medium"],
  },
};

export default config;
```

## Usage

### Scan a contract manually
```bash
npx hardhat vigil3 contracts/MyContract.sol
```
Generates `slither-report.json` at the project root.

### Check the plugin is loaded
```bash
npx hardhat v3
```

### Compile
Any command that triggers compilation (e.g. deploy scripts) will run the guard:
```bash
npx hardhat compile
```
If Slither finds issues at or above the configured severities, the process will fail and block the deployment.

## Slither Binary Location

The downloaded binary is stored in your home directory:
- Linux: `~/.vigil3/slither-linux`
- macOS: `~/.vigil3/slither-macos`
- Windows: `~/.vigil3/slither-win.exe`

## Update

```bash
npm update vigil3
```

## License

MIT

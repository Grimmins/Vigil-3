import { task } from "hardhat/config";
import type { HardhatPlugin } from "hardhat/types/plugins";

import "./type-extensions.js";

const plugin: HardhatPlugin = {
  id: "vigil3",
  hookHandlers: {
    config: () => import("./hooks/config.js"),
    network: () => import("./hooks/network.js"),
  },
  tasks: [
      task("v3", "vigil3 is up :)")
      .setAction(() => import("./tasks/v3.js"))
      .build()

      /*task("vigil3", "Analyze Solidity files with Slither")
      .addOption({
        name: "file",
        description: "Path to Solidity file or folder",
        type: ArgumentType.STRING,
        defaultValue: "contracts",
      })
      .setAction(() => import("./tasks/vigil3.js"))
      .build(),*/

    /*task("compile", "Compile and enforce Vigil3 security checks")
      .setAction(() => import("./tasks/compile.js"))
      .build(),*/
  ],
};

export default plugin;

#!/usr/bin/env node
import { init } from "./commands/init.js";
import { validate } from "./commands/validate.js";
import { render } from "./commands/render.js";
import { keygen } from "./commands/keygen.js";
import { sign } from "./commands/sign.js";
import { showHelp, showVersion } from "./help.js";

async function main(argv: string[]): Promise<number> {
  const [, , command, ...args] = argv;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    showHelp();
    return 0;
  }
  if (command === "--version" || command === "-v" || command === "version") {
    showVersion();
    return 0;
  }

  switch (command) {
    case "init":
      return init(args);
    case "validate":
      return validate(args);
    case "render":
      return render(args);
    case "keygen":
      return keygen(args);
    case "sign":
      return sign(args);
    default:
      console.error(`daena: unknown command '${command}'`);
      console.error("Run 'daena --help' for usage.");
      return 2;
  }
}

main(process.argv).then(
  (code) => process.exit(code),
  (err) => {
    console.error(`daena: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
);

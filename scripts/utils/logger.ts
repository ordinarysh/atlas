import pc from "picocolors";

export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(): Logger {
  return {
    info(message: string): void {
      console.info(`${pc.blue("ℹ")} ${message}`);
    },
    success(message: string): void {
      console.info(`${pc.green("✓")} ${message}`);
    },
    warn(message: string): void {
      console.warn(`${pc.yellow("⚠")} ${message}`);
    },
    error(message: string): void {
      console.error(`${pc.red("✗")} ${message}`);
    },
  };
}

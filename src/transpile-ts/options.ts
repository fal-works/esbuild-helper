import * as logger from "../util/logger.js";

export interface Options {
  /** Source directory path. */
  readonly srcDir: string;

  /** Output directory path. */
  readonly outDir: string;

  /** Glob patterns for ignoring source files. */
  readonly ignorePatterns?: string[];

  /** Path to `tsconfig.json`. */
  readonly tsconfig?: string;

  /** Log level. Defaults to `"info"`. */
  readonly logLevel?: logger.LogLevel;
}

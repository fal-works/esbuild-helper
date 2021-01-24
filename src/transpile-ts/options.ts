import type { BuildOptions } from "esbuild";
import * as logger from "../util/logger.js";

export interface Options {
  /** Source directory path. */
  readonly srcDir: string;

  /** Output directory path. */
  readonly outDir: string;

  /** Log level. Defaults to `"info"`. */
  readonly logLevel?: logger.LogLevel;

  /** Glob patterns for ignoring source files. */
  readonly ignorePatterns?: string[];

  /** esbuild options for overriding the default behavior. */
  readonly optionsOverride?: BuildOptions;
}

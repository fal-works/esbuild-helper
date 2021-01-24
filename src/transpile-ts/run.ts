import fastGlob from "fast-glob";
import esbuild from "esbuild";
import * as logger from "../util/logger.js";
import * as path from "../util/path.js";
import type { Options } from "./options";

/**
 * Transpiles all TypeScript files in `srcDir` into JavaScript.
 * @param options `srcDir`, `outDir` and other optionals.
 */
export const run = async (options: Options): Promise<void> => {
  const { info, warn } = logger.create(options.logLevel);

  const srcDir = path.normalize(options.srcDir);
  const outDir = path.normalize(options.outDir);

  const srcPattern = `${srcDir}/**/*.ts`;
  const srcFiles = await fastGlob(srcPattern, {
    onlyFiles: true,
    ignore: options.ignorePatterns,
  });
  if (srcFiles.length === 0) warn(`No files to transpile: ${srcPattern}`);

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: srcFiles,
    outdir: outDir,
  };
  Object.assign(buildOptions, options.optionsOverride);
  const transpile = esbuild.build(buildOptions);

  const result = await transpile;
  result.warnings.forEach((message) => warn(message));

  info(`Transpiled: ${srcPattern}`);
};

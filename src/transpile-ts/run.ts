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
  const { ignorePatterns, tsconfig } = options;

  const srcPattern = `${srcDir}/**/*.ts`;
  const srcFiles = await fastGlob(srcPattern, {
    onlyFiles: true,
    ignore: ignorePatterns,
  });
  if (srcFiles.length === 0) warn(`No files to transpile: ${srcPattern}`);

  const transpile = esbuild.build({
    entryPoints: srcFiles,
    outdir: outDir,
    tsconfig,
  });

  const result = await transpile;
  result.warnings.forEach((message) => warn(message));

  info(`Transpiled: ${srcPattern}`);
};

import fastGlob from "fast-glob";
import esbuild from "esbuild";
import * as logger from "../util/logger.js";
import * as path from "../util/path.js";
import type { Options } from "./options";

interface Transpiler {
  /**
   * Transpile any source files.
   * @param srcPatterns Defaults to all `*.ts` files in `srcDir`.
   */
  transpile: (srcPatterns?: string | string[]) => Promise<void>;

  /**
   * Dispose cache of transpiling results.
   */
  dispose: () => void;
}

/** For internal use. */
const prepareTranspileFile = (params: {
  readonly srcDir: string;
  readonly outDir: string;
  readonly tsconfig?: string;
  readonly onWarn: (message: esbuild.Message) => void;
}) => {
  const { srcDir, outDir, tsconfig, onWarn } = params;

  const rebuildMap = new Map<string, esbuild.BuildInvalidate>();
  const leadingSrcDir = new RegExp(`^${srcDir}`);

  const transpileFile = async (srcFile: string) => {
    srcFile = path.normalize(srcFile);

    // rebuild if already built
    const rebuild = rebuildMap.get(srcFile);
    if (rebuild) {
      const result = await rebuild();
      result.warnings.forEach(onWarn);
      return;
    }

    const outFile = path.tsToJs(srcFile.replace(leadingSrcDir, outDir));

    // build for the first time
    const result = await esbuild.build({
      entryPoints: [srcFile],
      outfile: outFile,
      tsconfig,
      incremental: true,
    });
    result.warnings.forEach(onWarn);
    rebuildMap.set(srcFile, result.rebuild);
  };

  const dispose = () => {
    for (const rebuild of rebuildMap.values()) rebuild.dispose();
  };

  return { transpileFile, dispose };
};

/**
 * Creates a function that transpiles TypeScript files in `srcDir` into
 * JavaScript incrementally.
 * @param options `srcDir`, `outDir` and other optionals.
 */
export const prepare = (options: Options): Transpiler => {
  const { info, warn } = logger.create(options.logLevel);

  const srcDir = path.normalize(options.srcDir);
  const outDir = path.normalize(options.outDir);

  const normalizeSrcPatterns = path.prepareNormalizePatterns(
    `${srcDir}/**/*.ts`
  );
  const globOptions = {
    onlyFiles: true,
    ignore: options.ignorePatterns,
  };

  const { transpileFile, dispose } = prepareTranspileFile({
    srcDir,
    outDir,
    tsconfig: options.tsconfig,
    onWarn: (message) => warn(message),
  });

  const transpile: Transpiler["transpile"] = async (srcPatterns) => {
    srcPatterns = normalizeSrcPatterns(srcPatterns);
    const srcFiles = await fastGlob(srcPatterns, globOptions);
    if (srcFiles.length === 0) warn(`No files to transpile: ${srcPatterns}`);

    await Promise.all(srcFiles.map(transpileFile));

    info(`Transpiled: ${srcPatterns}`);
  };

  return { transpile, dispose };
};

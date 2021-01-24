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
  run: (srcPatterns?: string | string[]) => Promise<void>;

  /**
   * Dispose cache of transpiling results.
   */
  dispose: () => void;
}

/** For internal use. */
const prepareTranspileFile = (params: {
  readonly srcDir: string;
  readonly outDir: string;
  readonly optionsOverride?: esbuild.BuildOptions;
  readonly onWarn: (message: esbuild.Message) => void;
}) => {
  const { srcDir, outDir, optionsOverride, onWarn } = params;

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

    // build for the first time
    const outFile = path.tsToJs(srcFile.replace(leadingSrcDir, outDir));
    const options: esbuild.BuildOptions & { incremental: true } = {
      entryPoints: [srcFile],
      outfile: outFile,
      incremental: true,
    };
    Object.assign(options, optionsOverride);
    const result = await esbuild.build(options);
    result.warnings.forEach(onWarn);
    rebuildMap.set(srcFile, result.rebuild);
  };

  const dispose = () => {
    for (const rebuild of rebuildMap.values()) rebuild.dispose();
  };

  return { transpileFile, dispose };
};

/**
 * Creates a transpiler instance that transpiles TypeScript files in `srcDir`
 * into JavaScript incrementally.
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
    optionsOverride: options.optionsOverride,
    onWarn: (message) => warn(message),
  });

  const run: Transpiler["run"] = async (srcPatterns) => {
    srcPatterns = normalizeSrcPatterns(srcPatterns);
    const srcFiles = await fastGlob(srcPatterns, globOptions);
    if (srcFiles.length === 0) warn(`No files to transpile: ${srcPatterns}`);

    await Promise.all(srcFiles.map(transpileFile));

    info(`Transpiled: ${srcPatterns}`);
  };

  return { run, dispose };
};

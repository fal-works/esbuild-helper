import fastGlob from "fast-glob";

const backSlashes = /\\+/g;
const trailingSlash = /\/+$/;
const tsExtension = /\.ts(x?)$/;

/**
 * Normalize `pathString` as follows:
 *
 * 1. Trim leading/trailing whitespaces.
 * 2. Replace `\` with `/`.
 * 3. Remove the trailing `/`.
 */
export const normalize = (pathString: string): string =>
  pathString.trim().replace(backSlashes, "/").replace(trailingSlash, "");

/**
 * - `*.ts` => `*.js`
 * - `*.tsx` => `*.jsx`
 */
export const tsToJs = (pathString: string): string =>
  pathString.replace(tsExtension, ".js$1");

/** Glob pattern or its array. */
export type FilePatterns = Parameters<typeof fastGlob>[0];

/** Creates a function that normalizes `FilePatterns` value. */
export const prepareNormalizePatterns = (defaultPatterns: FilePatterns) => (
  patterns: FilePatterns | undefined
): FilePatterns => {
  if (!patterns) return defaultPatterns;
  if (typeof patterns === "string") return normalize(patterns);
  return patterns.map(normalize);
};

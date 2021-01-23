import * as tinyLogger from "@fal-works/tiny-logger";

const prefix = "[esbuild-helper] ";
const prefixWarn = `${prefix}warn: `;

export type LogLevel = "info" | "warn" | "silent";

/**
 * Creates a function that prints info messages.
 */
const createInfo = (logLevel: LogLevel) => {
  switch (logLevel) {
    case "info":
      return tinyLogger.createSimple(prefix, process.stderr);
    case "warn":
    case "silent":
      return () => {};
  }
};

/**
 * Creates a function that prints warn messages.
 */
const createWarn = (logLevel: LogLevel) => {
  switch (logLevel) {
    case "info":
    case "warn":
      return tinyLogger.create(prefixWarn, process.stderr, console.warn);
    case "silent":
      return () => {};
  }
};

type Logger = {
  info: ReturnType<typeof createInfo>;
  warn: ReturnType<typeof createWarn>;
};

/**
 * Creates logging functions.
 * @param logLevel Defaults to `"info"`.
 */
export const create = (logLevel: LogLevel = "info"): Logger => ({
  info: createInfo(logLevel),
  warn: createWarn(logLevel),
});

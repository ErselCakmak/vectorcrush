#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { optimizeSvg } from "@vectorcrush/core";

type CliOptions = {
  input?: string;
  out?: string;
  check: boolean;
  precision?: number;
};

function invocationCwd(): string {
  return process.env.INIT_CWD ?? process.cwd();
}

function resolveCliPath(value: string, cwd: string): string {
  return path.isAbsolute(value) ? value : path.resolve(cwd, value);
}

function printHelp(): void {
  console.log(`VectorCrush

Usage:
  vectorcrush <input.svg> --out <output.svg>
  vectorcrush <directory> --out <output-directory>
  vectorcrush check <input.svg|directory>

Options:
  --out <path>          Output file or directory
  --precision <number>  Numeric precision, 0-8. Default: 3
`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { check: false };
  const args = [...argv];

  if (args[0] === "check") {
    options.check = true;
    args.shift();
  }

  options.input = args.shift();

  while (args.length > 0) {
    const arg = args.shift();

    if (arg === "--out") {
      options.out = args.shift();
      continue;
    }

    if (arg === "--precision") {
      const raw = args.shift();
      options.precision = raw === undefined ? undefined : Number(raw);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function collectSvgFiles(input: string): Promise<string[]> {
  const stat = await fs.stat(input);

  if (stat.isFile()) {
    if (!input.toLowerCase().endsWith(".svg")) {
      throw new Error(`Input file is not an SVG: ${input}`);
    }
    return [input];
  }

  if (!stat.isDirectory()) {
    throw new Error(`Input must be a file or directory: ${input}`);
  }

  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) {
        files.push(full);
      }
    }
  }

  await walk(input);
  return files.sort();
}

function outputPathFor(inputRoot: string, file: string, out: string): string {
  if (file === inputRoot) return out;
  const relative = path.relative(inputRoot, file);
  return path.join(out, relative);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.input || options.input === "--help" || options.input === "-h") {
    printHelp();
    return;
  }

  const cwd = invocationCwd();
  const inputPath = resolveCliPath(options.input, cwd);
  const outPath = options.out === undefined ? undefined : resolveCliPath(options.out, cwd);

  if (!(await pathExists(inputPath))) {
    throw new Error(`Input does not exist: ${options.input}`);
  }

  const files = await collectSvgFiles(inputPath);
  let beforeBytes = 0;
  let afterBytes = 0;
  let changedCount = 0;

  for (const file of files) {
    const input = await fs.readFile(file, "utf8");
    const result = optimizeSvg(input, { precision: options.precision });

    beforeBytes += result.beforeBytes;
    afterBytes += result.afterBytes;

    if (result.svg !== input) {
      changedCount += 1;
    }

    if (!options.check) {
      if (!outPath) {
        throw new Error("--out is required unless using check mode");
      }

      const output = outputPathFor(inputPath, file, outPath);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, result.svg, "utf8");
    }
  }

  const savedBytes = beforeBytes - afterBytes;
  const savedPercent = beforeBytes === 0 ? 0 : (savedBytes / beforeBytes) * 100;

  console.log(`Files: ${files.length}`);
  console.log(`Before: ${beforeBytes} bytes`);
  console.log(`After: ${afterBytes} bytes`);
  console.log(`Saved: ${savedBytes} bytes (${savedPercent.toFixed(2)}%)`);

  if (options.check && changedCount > 0) {
    console.error(`${changedCount} file(s) are not optimized.`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

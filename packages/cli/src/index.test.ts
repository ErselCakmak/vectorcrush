import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const tmpRoots: string[] = [];
const repoRoot = path.resolve("../..");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const cliSource = path.join(repoRoot, "packages", "cli", "src", "index.ts");

function makeTempRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "vectorcrush-cli-"));
  tmpRoots.push(root);
  return root;
}

function runCli(args: string[], cwd = repoRoot): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(process.execPath, [tsxCli, cliSource, ...args], {
    cwd,
    encoding: "utf8"
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status
  };
}

function runCliOk(args: string[]): string {
  return execFileSync(process.execPath, [tsxCli, cliSource, ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

afterEach(async () => {
  await Promise.all(tmpRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("vectorcrush CLI", () => {
  it("optimizes a direct file", () => {
    const root = makeTempRoot();
    const input = path.join(root, "input.svg");
    const output = path.join(root, "output.svg");

    writeFileSync(input, '<svg height="10.0000" width="10.5000"><!--x--><rect width="1.2300"/></svg>');

    const stdout = runCliOk([input, "--out", output]);

    expect(readFileSync(output, "utf8")).toBe('<svg width="10.5" height="10"><rect width="1.23"/></svg>');
    expect(stdout).toContain("Files: 1");
    expect(stdout).toMatch(/Before: \d+ bytes/u);
    expect(stdout).toMatch(/After: \d+ bytes/u);
    expect(stdout).toMatch(/Saved: \d+ bytes \(\d+\.\d{2}%\)/u);
  });

  it("optimizes a directory and preserves relative paths", async () => {
    const root = makeTempRoot();
    const inputDir = path.join(root, "icons");
    const nestedDir = path.join(inputDir, "nested");
    const outDir = path.join(root, "out");

    await mkdir(nestedDir, { recursive: true });
    writeFileSync(path.join(inputDir, "root.svg"), '<svg width="2.0000" height="2.0000"></svg>');
    writeFileSync(path.join(nestedDir, "child.svg"), '<svg height="3.0000" width="4.5000"></svg>');
    writeFileSync(path.join(nestedDir, "notes.txt"), "ignore me");

    const stdout = runCliOk([inputDir, "--out", outDir]);

    expect(readFileSync(path.join(outDir, "root.svg"), "utf8")).toBe('<svg width="2" height="2"></svg>');
    expect(readFileSync(path.join(outDir, "nested", "child.svg"), "utf8")).toBe(
      '<svg width="4.5" height="3"></svg>'
    );
    expect(stdout).toContain("Files: 2");
  });

  it("check mode exits zero when files are already optimized", () => {
    const root = makeTempRoot();
    const input = path.join(root, "clean.svg");
    writeFileSync(input, '<svg width="1" height="1"><rect width="1" height="1"/></svg>');

    const result = runCli(["check", input]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Files: 1");
    expect(result.stderr).toBe("");
  });

  it("check mode exits non-zero when files would change", () => {
    const root = makeTempRoot();
    const input = path.join(root, "dirty.svg");
    writeFileSync(input, '<svg height="1.0000" width="1.0000"><!--x--></svg>');

    const result = runCli(["check", input]);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Files: 1");
    expect(result.stderr).toContain("1 file(s) are not optimized.");
  });
});

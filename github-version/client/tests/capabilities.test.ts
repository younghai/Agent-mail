import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const appDir = join(import.meta.dirname, "..", "app");

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? sourceFiles(path) : [path];
	});
}

describe("capabilities", () => {
	it("is the only place that reads the Replit production build flag", () => {
		// Every component asks what the build can do; none asks which platform it runs on.
		const readers = sourceFiles(appDir)
			.filter((path) => /\.tsx?$/.test(path))
			.filter((path) => readFileSync(path, "utf8").includes("VITE_REPLIT_PRODUCTION"))
			.map((path) => path.slice(appDir.length + 1));
		assert.deepEqual(readers, ["lib/capabilities.ts"]);
	});
});

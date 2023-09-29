import { describe, it } from "https://deno.land/std@0.201.0/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import { dirname } from "https://deno.land/std@0.201.0/path/mod.ts";
import {
  pathToSpecifier,
  listLocalModules,
  resolveTestScript,
  resolveTestScriptAll,
} from "./mod.ts";

const dir = dirname(new URL(import.meta.url).href);

describe("pathToSpecifier", () => {
  it("should convert a path to a specifier", () => {
    assertEquals(
      pathToSpecifier("/mod.ts"),
      "file:///mod.ts",
    );
  });
});

describe("listLocalModules", () => {
  it("should list local dependencies of a script", async () => {
    assertEquals(
      await listLocalModules(`${dir}/mod.ts`),
      [
        `${dir}/mod.ts`,
      ],
    );
  });
});

describe("resolveTestScript", () => {
  it("should return a test script and its dependencies", async () => {
    assertEquals(
      await resolveTestScript(`${dir}/test.ts`),
      {
        specifier: `${dir}/test.ts`,
        modules: [
          `${dir}/mod.ts`,
          `${dir}/test.ts`,
        ],
      },
    );
  });
});

describe("resolveTestScriptAll", () => {
  it("should return all test scripts and their dependencies", async () => {
    assertEquals(
      await resolveTestScriptAll(),
      [
        {
          specifier: `${dir}/test.ts`,
          modules: [
            "file:///home/shun/lophus/lib/x/malcolm/mod.ts",
            "file:///home/shun/lophus/lib/x/malcolm/test.ts",
          ],
        },
      ],
    );
  });
});

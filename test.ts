import { describe, it } from "https://deno.land/std@0.201.0/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import {
  listLocalModules,
  resolveTestScript,
  resolveTestScriptAll,
} from "./mod.ts";

describe("listLocalModules", () => {
  it("should list local dependencies of a script", async () => {
    assertEquals(
      await listLocalModules("./mod.ts"),
      [
        "file:///home/shun/lophus/lib/x/malcolm/mod.ts",
      ],
    );
  });
});

describe("resolveTestScript", () => {
  it("should return a test script and its dependencies", async () => {
    assertEquals(
      await resolveTestScript("test.ts"),
      {
        path: "test.ts",
        modules: [
          "file:///home/shun/lophus/lib/x/malcolm/mod.ts",
          "file:///home/shun/lophus/lib/x/malcolm/test.ts",
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
          path: "test.ts",
          modules: [
            "fiile:///home/shun/lophus/lib/x/malcolm/mod.ts",
            "file:///home/shun/lophus/lib/x/malcolm/test.ts",
          ],
        },
      ],
    );
  });
});

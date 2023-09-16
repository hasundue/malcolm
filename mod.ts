import {
  createGraph,
  load as defaultLoad,
} from "https://deno.land/x/deno_graph@0.55.0/mod.ts";
import {
  globToRegExp,
  resolve,
  toFileUrl,
} from "https://deno.land/std@0.201.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.201.0/fs/mod.ts";

// Ref: https://deno.land/manual@v1.36.4/basics/testing#running-tests
export const GLOB_TEST = "{*_,*.,}test.{ts, tsx, mts, js, mjs, jsx}";
export const REGEXP_TEST = globToRegExp(GLOB_TEST);

export function normalizePath(path: string): string {
  return toFileUrl(resolve(path)).toString();
}

export async function listLocalModules(scriptPath: string): Promise<string[]> {
  const graph = await createGraph(
    toFileUrl(resolve(scriptPath)).toString(),
    {
      load(specifier) {
        return specifier.startsWith("file:///")
          ? defaultLoad(specifier)
          : Promise.reject();
      },
    },
  );
  return graph.modules
    .filter((m) => m.error === undefined)
    .map((m) => m.specifier);
}

export type TestScript = {
  path: string;
  modules: string[];
};

export async function resolveTestScript(path: string): Promise<TestScript> {
  const modules = await listLocalModules(path);
  return { path: path, modules };
}

export async function resolveTestScriptAll(root = "."): Promise<TestScript[]> {
  const iter = walk(root, {
    includeDirs: false,
    followSymlinks: true,
    match: [REGEXP_TEST],
  });
  const promises: Promise<TestScript>[] = [];
  for await (const { path } of iter) {
    promises.push(resolveTestScript(path));
  }
  return Promise.all(promises);
}

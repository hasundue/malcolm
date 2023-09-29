/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />
import { intersect } from "https://deno.land/std@0.201.0/collections/intersect.ts";
import { withoutAll } from "https://deno.land/std@0.201.0/collections/without_all.ts";
import { basename } from "https://deno.land/std@0.201.0/path/mod.ts";
import * as log from "https://deno.land/std@0.201.0/log/mod.ts";
import { getLogger } from "https://deno.land/std@0.201.0/log/mod.ts";
import {
  pathToSpecifier,
  REGEXP_SOURCE,
  REGEXP_TEST,
  resolveTestScript,
  resolveTestScriptAll,
} from "./mod.ts";

export interface WorkerOptions {
  /**
   * The root directory of the project.
   * @default "."
   */
  root?: string;

  /**
   * The optional arguments to pass to `deno test`.
   * @default ["--allow-all", "--unstable"]
   */
  args?: string[];
}

export type EventListner = (
  this: Worker,
  ev: MessageEvent<Deno.CommandOutput>,
) => void | Promise<void>;

export class MalcolmWorker extends Worker {
  constructor(options: WorkerOptions) {
    super(new URL(import.meta.url).href, {
      type: "module",
    });
    this.postMessage(options);
  }
  declare addEventListener: (
    type: "message",
    listener: EventListner | EventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void | Promise<void>;
}

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: ({ levelName, msg, args }) => {
        const arg = args[0] ? JSON.stringify(args[0], null, 2) : "";
        return `[${levelName}] ${msg} ${arg}`;
      },
    }),
  },
  loggers: {
    "malcolm": {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

addEventListener("message", async (msg: MessageEvent<WorkerOptions>) => {
  const log = getLogger("malcolm");
  log.debug("Worker started");

  log.debug("Worker options:", msg.data);
  const {
    root = ".",
    args = ["--allow-all", "--unstable"],
  } = msg.data;

  let tests = await resolveTestScriptAll(root);
  log.debug("Worker resolved tests:", tests);

  const watcher = Deno.watchFs(root);

  for await (const event of watcher) {
    if (event.kind === "access" || event.kind === "other") {
      continue;
    }
    const specifiers = event.paths.map(pathToSpecifier)
      .filter((s) => REGEXP_SOURCE.test(basename(s)));
    if (!specifiers.length) {
      continue;
    }
    log.debug("Worker found relevant event:", event);
    if (event.kind === "create") {
      const newTests = await Promise.all(
        specifiers
          .filter((s) => REGEXP_TEST.test(basename(s)))
          .filter((s) => !tests.some((t) => t.specifier === s))
          .map((s) => resolveTestScript(s)),
      );
      if (!newTests.length) {
        continue;
      }
      tests = intersect(tests, newTests);
      log.debug("Worker resolved new tests:", newTests);
    }
    if (event.kind === "remove") {
      const removedTests = tests.filter((t) =>
        specifiers.includes(t.specifier)
      );
      tests = withoutAll(tests, removedTests);
      log.debug("Worker removed tests:", removedTests);
    }
    if (event.kind === "modify") {
      const targets = tests
        .filter((t) => intersect(t.modules, specifiers).length)
        .map((t) => t.specifier);
      if (!targets.length) {
        continue;
      }
      log.debug("Running tests for:", targets);
      const command = new Deno.Command(Deno.execPath(), {
        args: ["test", ...args, ...targets],
        cwd: root,
      });
      const output = await command.output();
      postMessage(output);
    }
  }
});

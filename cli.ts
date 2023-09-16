import { Command } from "https://deno.land/x/cliffy@v0.25.7/mod.ts";
import { MalcolmWorker } from "./worker.ts";

await new Command()
  .name("malcolm")
  .version("0.1.0")
  .action(main) .parse(Deno.args);

function main() {
  const decoder = new TextDecoder();

  const worker = new MalcolmWorker({ root: "." });
  worker.addEventListener("message", (msg) => {
    const { stdout, stderr } = msg.data;
    console.log(decoder.decode(stdout));
    console.error(decoder.decode(stderr));
  });
}

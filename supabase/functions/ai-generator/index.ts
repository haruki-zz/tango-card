import { buildDefaultHandlerDeps, createHandler } from "./handler.ts";

const handler = createHandler(buildDefaultHandlerDeps());

Deno.serve(handler);

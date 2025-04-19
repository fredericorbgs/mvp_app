import { defineFunction } from "@aws-amplify/backend";

export const askRAG = defineFunction({
  name: "ask-rag",
  entry: "./handler.ts",
});

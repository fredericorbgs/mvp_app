import { defineFunction } from "@aws-amplify/backend";

export const ask = defineFunction({
  name: "ask",
  entry: "./handler.ts"
});
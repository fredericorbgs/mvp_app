import { defineBackend } from "@aws-amplify/backend";
import { storage } from "./storage/resource";
import { ask } from "./ask/resource";

export const backend = defineBackend({
  storage,
  ask,
});
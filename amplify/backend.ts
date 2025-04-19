import { defineBackend } from "@aws-amplify/backend";
import { uploadFile } from "./functions/uploadFile/resource";
import { listFiles } from "./functions/listFiles/resource";
import { askRAG } from "./functions/askRAG/resource";

export const backend = defineBackend({
  uploadFile,
  listFiles,
  askRAG,
});

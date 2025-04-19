import { defineBackend } from "@aws-amplify/backend";
import { ask } from "./ask/resource";
import { upload } from "./upload/resource";
import { listFiles } from "./listFiles/resource";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";

export default defineBackend({
  auth,
  data,
  storage,
  ask,
  upload,
  listFiles,
});

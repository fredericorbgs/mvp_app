import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "rivo-user-files",
  access: (allow) => ({
    "public/*": [allow.authenticated.to(["read", "write", "delete"])],
  }),
});
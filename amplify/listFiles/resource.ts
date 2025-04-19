import { defineFunction } from "@aws-amplify/backend";

export const listFiles = defineFunction({
  name: "listFiles",
  entry: "./handler.ts",
  environment: {
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME!,
  },
});

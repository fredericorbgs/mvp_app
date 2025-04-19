import { defineFunction } from "@aws-amplify/backend";

export const upload = defineFunction({
  name: "uploadFile",
  entry: "./handler.ts",
  environment: {
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME!,
    KB_ID: process.env.KB_ID!,
  },
});

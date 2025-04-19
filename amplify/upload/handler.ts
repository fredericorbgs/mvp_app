import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockAgentRuntimeClient,
  CreateDataSourceCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const s3 = new S3Client({});
const bedrock = new BedrockAgentRuntimeClient({});

export const handler = async (event: any) => {
  const { fileName, base64Data, description } = JSON.parse(event.body);
  if (!fileName || !base64Data) {
    return { statusCode: 400, body: "fileName e base64Data são obrigatórios" };
  }

  const Bucket = process.env.S3_BUCKET_NAME!;
  const data = Buffer.from(base64Data, "base64");

  // 1) envia ao S3
  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key: fileName,
      Body: data,
      Metadata: description ? { description } : {},
    })
  );

  // 2) opcional: dispara nova ingestão na KB
  await bedrock.send(
    new CreateDataSourceCommand({
      knowledgeBaseId: process.env.KB_ID!,
      name: `source-${fileName}`,
      dataSourceConfiguration: {
        s3Configuration: { bucketArn: `arn:aws:s3:::${Bucket}` },
      },
      vectorIngestionConfiguration: {
        ingestionUpdatePolicy: "FULL",
      },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Upload e ingestão OK" }),
  };
};

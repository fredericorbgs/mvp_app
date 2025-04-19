import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export const handler = async () => {
  const Bucket = process.env.S3_BUCKET_NAME!;
  const { Contents = [] } = await s3.send(
    new ListObjectsV2Command({ Bucket })
  );

  const files = Contents.map((f) => ({
    nome: f.Key,
    dataUpload: f.LastModified,
    tamanho: f.Size,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(files),
  };
};

// app/api/files/route.ts
import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Atenção: a variável de ambiente S3_BUCKET_NAME deve estar configurada no Vercel
const bucket = process.env.S3_BUCKET_NAME!;
if (!bucket) {
  throw new Error("Missing S3_BUCKET_NAME env var");
}

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function GET() {
  // lista até 1000 objetos (ajuste MaxKeys se precisar de mais)
  const { Contents } = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    MaxKeys: 1000,
  }));

  const files = (Contents ?? []).map((obj) => ({
    // nome completo da chave
    s3_key: obj.Key,
    // usando só o nome-base (se quiser)
    nome: obj.Key?.split("/").pop() ?? obj.Key,
    // ainda não armazenamos nenhuma descrição, então fica vazio
    descricao: "",
    // data de upload: ISO string
    dataUpload: obj.LastModified?.toISOString() ?? "",
    // tamanho em bytes
    tamanho: obj.Size ?? 0,
  }));

  return NextResponse.json(files);
}

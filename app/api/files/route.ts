import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function GET() {
  const bucket = process.env.S3_BUCKET_NAME!;
  // Lista até 1000 objetos; paginar se precisar
  const { Contents = [] } = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket })
  );

  // Mapeia para o shape que o front end espera
  const files = Contents.map((obj) => ({
    s3_key: obj.Key!,
    nome: obj.Key!.split("/").pop(),           // só o nome, sem path
    descricao: "-",                             // metadata não vem aqui
    dataUpload: obj.LastModified?.toISOString(),// string ISO
    tamanho: obj.Size!,                         // em bytes
  }));

  return NextResponse.json(files);
}

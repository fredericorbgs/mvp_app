import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const s3 = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
})

export async function GET() {
  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME!,
    })
  )

  const files = await Promise.all(
    (list.Contents || []).map(async (item) => {
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: item.Key!,
        })
      )

      return {
        s3_key: item.Key,
        nome: head.Metadata?.nome || item.Key,
        descricao: head.Metadata?.descricao || '-',
        dataUpload: head.Metadata?.uploaddate || item.LastModified?.toISOString() || '',
        tamanho: item.Size,
      }
    })
  )

  return NextResponse.json(files)
}

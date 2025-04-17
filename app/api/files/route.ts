import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET() {
  const data = await s3.send(new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET_NAME,
  }))

  const files = (data.Contents || []).map(obj => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
  }))

  return NextResponse.json(files)
}

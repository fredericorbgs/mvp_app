import { NextResponse } from 'next/server'
import {
  S3Client,
  ListObjectsV2Command,
  type _Object
} from '@aws-sdk/client-s3'

const { AWS_REGION, S3_BUCKET_NAME } = process.env

if (!AWS_REGION || !S3_BUCKET_NAME) {
  throw new Error('Defina AWS_REGION e S3_BUCKET_NAME nas env vars.')
}

const s3 = new S3Client({ region: AWS_REGION })

export async function GET() {
  const { Contents = [] } = await s3.send(
    new ListObjectsV2Command({ Bucket: S3_BUCKET_NAME, Prefix: 'uploads/' }),
  )

  type Obj = Required<_Object>

  const files = (Contents as Obj[]).map((o) => ({
    key: o.Key!,
    name: o.Key!.split('/').pop()!,
    size: o.Size ?? 0,
    lastModified: o.LastModified?.toISOString() ?? '',
  }))

  return NextResponse.json(files)
}

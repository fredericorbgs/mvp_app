/* eslint-env node */
import { NextResponse } from 'next/server'
import {
  S3Client,
  PutObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3'

const { AWS_REGION, S3_BUCKET_NAME } = process.env

if (!AWS_REGION || !S3_BUCKET_NAME) {
  throw new Error('Defina AWS_REGION e S3_BUCKET_NAME nas env vars.')
}

const s3 = new S3Client({ region: AWS_REGION })

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Envie multipart‑form com campo "file".' }, { status: 400 })
  }

  const key = `uploads/${Date.now()}-${file.name}`

  const body = Buffer.from(await file.arrayBuffer())
  const params: PutObjectCommandInput = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: file.type || 'application/octet-stream',
  }

  await s3.send(new PutObjectCommand(params))

  return NextResponse.json({ key })
}

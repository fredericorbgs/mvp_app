import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get('file') as Blob
  const descricao = (form.get('descricao') as string) || ''

  if (!file || !file.arrayBuffer) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file instanceof File ? file.name : `upload-\${Date.now()}`,
    Body: buffer,
    Metadata: { descricao },
  }))

  return NextResponse.json({ ok: true })
}

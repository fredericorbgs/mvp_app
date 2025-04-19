import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const s3 = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const descricao = formData.get('descricao')?.toString() || ''

  if (!file || !file.name) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  const s3Key = `${Date.now()}_${file.name}`

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
      Body: Buffer.from(await file.arrayBuffer()),
      Metadata: {
        descricao,
        nome: file.name,
        uploadDate: new Date().toISOString(),
      },
    })
  )

  return NextResponse.json({ message: 'Upload bem-sucedido' })
}

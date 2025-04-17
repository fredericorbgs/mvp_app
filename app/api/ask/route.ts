import { NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  const { question } = await request.json()
  if (!question) {
    return NextResponse.json({ error: 'Pergunta em branco' }, { status: 400 })
  }

  // montar payload para geração direta
  const payload = {
    inputText: question,
    textGenerationConfig: {
      maxTokenCount: 200,
      temperature: 0.2,
      topP: 0.9,
      stopSequences: [],
    }
  }

  const cmd = new InvokeModelCommand({
    modelId: process.env.MODEL_ID,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
  const resp = await client.send(cmd)
  const buf = Buffer.from(await resp.body!.transformToByteArray())
  const result = JSON.parse(buf.toString('utf-8'))

  // extrai primeira saída
  const answer = result.results?.[0]?.outputText || null
  return NextResponse.json({ text: answer })
}

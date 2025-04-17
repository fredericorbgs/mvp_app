// app/api/ask/route.ts
import { NextResponse } from 'next/server'
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrieveAndGenerateCommandOutput,
} from '@aws-sdk/client-bedrock-agent-runtime'

/* ------------------------------------------------------------------ */
/* 1. Variáveis de ambiente obrigatórias                               */
/* ------------------------------------------------------------------ */
const { AWS_REGION, KB_ID, MODEL_ID } = process.env

if (!AWS_REGION || !KB_ID || !MODEL_ID) {
  throw new Error(
    'Defina AWS_REGION, KB_ID e MODEL_ID nas variáveis de ambiente.',
  )
}

/* ------------------------------------------------------------------ */
/* 2. Cliente Bedrock Runtime                                          */
/* ------------------------------------------------------------------ */
const client = new BedrockAgentRuntimeClient({ region: AWS_REGION })

/* ------------------------------------------------------------------ */
/* 3. Handler POST                                                     */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  /* ---------- 3.1  Valida o body ---------- */
  type AskBody = { question: string }

  let data: AskBody
  try {
    data = (await req.json()) as AskBody
  } catch {
    return NextResponse.json(
      { error: 'Corpo mal‑formado. Envie JSON { question: string }.' },
      { status: 400 },
    )
  }

  if (!data.question?.trim()) {
    return NextResponse.json(
      { error: 'Campo "question" é obrigatório.' },
      { status: 400 },
    )
  }

  /* ---------- 3.2  Monta o comando ---------- */
  const command = new RetrieveAndGenerateCommand({
    input: { text: data.question },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KB_ID,
        modelArn: MODEL_ID,
      },
    },
  })

  /* ---------- 3.3  Chama Bedrock KB ---------- */
  try {
    const resp: RetrieveAndGenerateCommandOutput = await client.send(command)

    // `resp.body` é um ReadableStream<Uint8Array> adaptado.
    const ab = await resp.body?.arrayBuffer()
    const rawJson = ab ? new TextDecoder().decode(ab) : '{}'

    const { results = [] } = JSON.parse(rawJson) as {
      results?: { outputText?: string }[]
    }

    const text = results[0]?.outputText ?? ''

    return NextResponse.json({ text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/ask] erro:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

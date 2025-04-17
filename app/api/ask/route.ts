// app/api/ask/route.ts
import { NextResponse } from 'next/server'
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrieveAndGenerateCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime'

/* ------------------------------------------------------------------ */
/* 1. Variáveis de ambiente obrigatórias                              */
/* ------------------------------------------------------------------ */
const { AWS_REGION, KB_ID, MODEL_ID } = process.env
if (!AWS_REGION || !KB_ID || !MODEL_ID) {
  throw new Error(
    'Defina AWS_REGION, KB_ID e MODEL_ID nas variáveis de ambiente.'
  )
}

/* ------------------------------------------------------------------ */
/* 2. Cliente Bedrock                                                  */
/* ------------------------------------------------------------------ */
const client = new BedrockAgentRuntimeClient({ region: AWS_REGION })

/* ------------------------------------------------------------------ */
/* 3. Handler POST                                                     */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  // 3.1 – parse e validação do body
  let payload: { question?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Corpo inválido. Envie JSON { "question": "sua pergunta" }' },
      { status: 400 }
    )
  }
  if (!payload.question?.trim()) {
    return NextResponse.json(
      { error: 'Campo "question" é obrigatório.' },
      { status: 400 }
    )
  }

  // 3.2 – monta o input usando o tipo oficial do SDK
  const commandInput: RetrieveAndGenerateCommandInput = {
    input: { text: payload.question },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KB_ID,
        modelArn: MODEL_ID,
        // opcional: ajusta temperatura, topP, etc
        generationConfiguration: {
          inferenceConfig: {
            textInferenceConfig: {
              maxTokens: 512,
              temperature: 0.2,
              topP: 0.9,
              stopSequences: [],
            },
          },
        },
      },
    },
  }

  const cmd = new RetrieveAndGenerateCommand(commandInput)

  // 3.3 – envia para o Bedrock e lê o response
  try {
    const resp = await client.send(cmd)
    // resp.body é um ReadableStream<Uint8Array>
    const arrayBuffer = await resp.body?.arrayBuffer() ?? new ArrayBuffer(0)
    const raw = new TextDecoder().decode(arrayBuffer)
    // parseamos usando interface explícita
    interface RagResponse {
      results?: { outputText?: string }[]
    }
    const parsed = JSON.parse(raw) as RagResponse
    const text = parsed.results?.[0]?.outputText ?? ''

    return NextResponse.json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/ask] erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

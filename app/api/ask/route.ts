// app/api/ask/route.ts
import { NextResponse } from 'next/server'
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrieveAndGenerateCommandOutput,
} from '@aws-sdk/client-bedrock-agent-runtime'

/* ------------------------------------------------------------------ */
/* 1. Variáveis de ambiente                                            */
/* ------------------------------------------------------------------ */
const { AWS_REGION, KB_ID, MODEL_ID } = process.env

if (!AWS_REGION || !KB_ID || !MODEL_ID) {
  throw new Error(
    'Defina AWS_REGION, KB_ID e MODEL_ID nas env‑vars (Vercel → Settings → Env Vars).',
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
  /** ---------- 3.1  Valida o body ---------- */
  interface AskBody {
    question: string
  }
  let body: AskBody
  try {
    body = (await req.json()) as AskBody
  } catch {
    return NextResponse.json(
      { error: 'Envie JSON { "question": "<texto>" }' },
      { status: 400 },
    )
  }

  if (!body.question?.trim()) {
    return NextResponse.json(
      { error: 'Campo "question" é obrigatório.' },
      { status: 400 },
    )
  }

  /** ---------- 3.2  Monta input p/ AWS ---------- */
  const input: Parameters<typeof RetrieveAndGenerateCommand>[0] = {
    input: { text: body.question },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KB_ID,
        modelArn: MODEL_ID,
        // (opcional) geração mais “assertiva”:
        generationConfiguration: {
          inferenceConfig: {
            textInferenceConfig: {
              temperature: 0.2,   // respostas mais determinísticas
              topP: 0.9,
              maxTokens: 512,
              stopSequences: [],  // deixe vazio p/ completar livre
            },
          },
        },
      },
    },
  }

  /** ---------- 3.3  Chama Bedrock RAG ---------- */
  try {
    const cmd = new RetrieveAndGenerateCommand(input)
    const resp: RetrieveAndGenerateCommandOutput = await client.send(cmd)

    // body é um ReadableStream<Uint8Array>. Convertemos para string JSON:
    const ab = await resp.body!.arrayBuffer()
    const raw = new TextDecoder().decode(ab)
    const { output } = JSON.parse(raw) as { output: { text: string } }

    return NextResponse.json({ text: output.text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/ask] Bedrock erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

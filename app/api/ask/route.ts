// app/api/ask/route.ts
import { NextResponse } from 'next/server'
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrieveAndGenerateCommandInput,
  type RetrieveAndGenerateCommandOutput,
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

  // 3.2 – monta input com o tipo oficial
  const commandInput: RetrieveAndGenerateCommandInput = {
    input: { text: payload.question },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KB_ID,
        modelArn: MODEL_ID,
        // ajustes opcionais para qualidade/factualidade
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

  // 3.3 – envia o comando
  let resp: RetrieveAndGenerateCommandOutput
  try {
    resp = await client.send(new RetrieveAndGenerateCommand(commandInput))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/ask] erro no Bedrock:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 3.4 – extrai o texto diretamente de resp.output.text
  const text = resp.output?.text ?? ''
  return NextResponse.json({ text })
}

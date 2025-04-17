/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrieveAndGenerateCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime'

const { REGION, KB_ID, MODEL_ID } = process.env

if (!REGION || !KB_ID || !MODEL_ID) {
  throw new Error('Defina REGION, KB_ID e MODEL_ID nas env vars.')
}

const bedrock = new BedrockAgentRuntimeClient({ region: REGION })

export async function POST(req: Request) {
  interface AskBody { question: string }
  let data: AskBody

  try {
    data = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'JSON mal‑formado. Use {"question": "..."}' },
      { status: 400 },
    )
  }

  if (!data.question?.trim()) {
    return NextResponse.json(
      { error: 'Campo "question" é obrigatório.' },
      { status: 400 },
    )
  }

  const input: RetrieveAndGenerateCommandInput = {
    input: { text: data.question },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KB_ID,
        modelArn: MODEL_ID,
        generationConfiguration: {
          inferenceConfig: {
            textInferenceConfig: {
              temperature: 0.2,
              topP: 0.9,
              maxTokens: 512,
            },
          },
        },
      },
    },
  }

  try {
    const { output } = await bedrock.send(new RetrieveAndGenerateCommand(input))

    return NextResponse.json({ text: output?.text ?? '' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/ask] erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

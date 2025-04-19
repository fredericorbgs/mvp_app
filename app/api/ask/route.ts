import { NextResponse } from 'next/server'
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrieveAndGenerateCommandOutput,
} from '@aws-sdk/client-bedrock-agent-runtime'

const client = new BedrockAgentRuntimeClient({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
})

interface AskBody {
  question: string
}

export async function POST(req: Request) {
  const { question } = (await req.json()) as AskBody

  if (!question || !question.trim()) {
    return NextResponse.json({ error: 'Pergunta inválida.' }, { status: 400 })
  }

  const cmd = new RetrieveAndGenerateCommand({
    input: { text: question },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: process.env.KB_ID!,
        modelArn: process.env.MODEL_ID!,
        generationConfiguration: {
          inferenceConfig: {
            textInferenceConfig: {
              temperature: 0.2,
              topP: 0.9,
              maxTokens: 1024,
              stopSequences: [],
            },
          },
        },
      },
    },
  })

  try {
    const resp: RetrieveAndGenerateCommandOutput = await client.send(cmd)
    const ab = await resp.body?.arrayBuffer()
    const raw = ab ? new TextDecoder().decode(ab) : '{}'
    const parsed = JSON.parse(raw) as { output?: { text?: string } }

    return NextResponse.json({ text: parsed.output?.text ?? '' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ask] Erro Bedrock:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

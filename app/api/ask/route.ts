// app/api/ask/route.ts
import { NextResponse } from "next/server"
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime"

export async function POST(request: Request) {
  // 1) Extrai a pergunta do body da requisição
  const { question } = await request.json()

  // 2) Cria o cliente Bedrock com credenciais da env
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  // 3) Prepara o comando invoke-model
  const cmd = new InvokeModelCommand({
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    body: JSON.stringify({
      inputText: question,
      textGenerationConfig: {
        maxTokenCount: 200,
        temperature: 0.2,
        topP: 0.9,
        stopSequences: [],
      },
    }),
  })

  // 4) Executa
  const resp = await client.send(cmd)

  // 5) Usa a Web API Response para ler o corpo como string
  const rawText = await new Response(resp.body!).text()

  // 6) Faz parse do JSON retornado pelo Bedrock
  const parsed = JSON.parse(rawText)

  // 7) Extrai a saída desejada
  //    depende do modelo – aqui assumimos a propriedade `results[0].outputText`
  const text = parsed.results?.[0]?.outputText ?? ""

  // 8) Retorna no formato { text }
  return NextResponse.json({ text })
}

// app/api/ask/route.ts
import { NextResponse } from "next/server";
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand, 
} from "@aws-sdk/client-bedrock-agent-runtime";

const REGION = process.env.AWS_REGION!;
const KB_ID = process.env.KB_ID!;
const MODEL_ID = process.env.MODEL_ID!;

// validações básicas
if (!REGION || !KB_ID || !MODEL_ID) {
  throw new Error(
    "As env vars AWS_REGION, KB_ID e MODEL_ID devem estar definidas"
  );
}

const client = new BedrockAgentRuntimeClient({ region: REGION });

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "Envie um JSON { question: 'sua pergunta' }" },
      { status: 400 }
    );
  }

  // monta o comando de RAG
  const cmd = new RetrieveAndGenerateCommand({
    input: { text: question },
    retrieveAndGenerateConfiguration: {
      type: "KNOWLEDGE_BASE",
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KB_ID,
        modelArn: MODEL_ID,
      },
    },
  });

  try {
    const resp = await client.send(cmd);

    // body é um BlobAdapter, convertemos para arrayBuffer
    const arrayBuffer = await resp.body!.arrayBuffer();
    const text = new TextDecoder("utf-8")
      .decode(arrayBuffer)
      // o retorno JSON do Bedrock vem assim:
      // { inputTextTokenCount: ..., results: [{ outputText: "..."}] }
      .replace(/^[^{]*/, ""); // remove lixo antes do JSON

    const parsed = JSON.parse(text);
    const answer = parsed.results?.[0]?.outputText ?? "";

    return NextResponse.json({ text: answer });
  } catch (err: any) {
    console.error("Erro no RAG:", err);
    return NextResponse.json(
      { error: err.message ?? "Erro desconhecido" },
      { status: 500 }
    );
  }
}

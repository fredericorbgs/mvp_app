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
    const arrayBuffer = await resp.body!.arrayBuffer();
    const txt = new TextDecoder("utf-8")
      .decode(arrayBuffer)
      .replace(/^[^{]*/, "");

    const { results } = JSON.parse(txt);
    const answer = Array.isArray(results) && results[0]?.outputText
      ? results[0].outputText
      : "";

    return NextResponse.json({ text: answer });
  } catch (unknownErr) {
    // evita o `any` e satisfaz o ESLint
      } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Erro no RAG:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

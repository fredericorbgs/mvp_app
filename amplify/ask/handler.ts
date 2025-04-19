import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: process.env.REGION });

export const handler = async (event: { body: string }) => {
  const { question } = JSON.parse(event.body || "{}");

  if (!question) {
    return { statusCode: 400, body: JSON.stringify({ error: "Pergunta vazia" }) };
  }

  const cmd = new RetrieveAndGenerateCommand({
    input: { text: question },
    retrieveAndGenerateConfiguration: {
      type: "KNOWLEDGE_BASE",
      knowledgeBaseConfiguration: {
        knowledgeBaseId: process.env.KB_ID!,
        modelArn: process.env.MODEL_ID!,
      },
    },
  });

  try {
    const resp = await client.send(cmd);
    const ab = await resp.body?.arrayBuffer();
    const raw = ab ? new TextDecoder().decode(ab) : "{}";
    const { results } = JSON.parse(raw);
    const answer = results?.[0]?.outputText ?? "";

    return { statusCode: 200, body: JSON.stringify({ text: answer }) };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Erro inesperado" }),
    };
  }
};

import {
    BedrockAgentRuntimeClient,
    RetrieveAndGenerateCommand,
  } from "@aws-sdk/client-bedrock-agent-runtime";
  
  const client = new BedrockAgentRuntimeClient({ region: process.env.REGION });
  
  export const handler = async (event: any) => {
    const question = event.arguments?.question;
  
    const cmd = new RetrieveAndGenerateCommand({
      input: { text: question },
      retrieveAndGenerateConfiguration: {
        type: "KNOWLEDGE_BASE",
        knowledgeBaseConfiguration: {
          knowledgeBaseId: process.env.KB_ID,
          modelArn: process.env.MODEL_ID,
        },
      },
    });
  
    const resp = await client.send(cmd);
    const ab = await resp.body?.arrayBuffer();
    const raw = new TextDecoder().decode(ab || new ArrayBuffer(0));
    const { output } = JSON.parse(raw);
    return output?.text || "Sem resposta.";
  };
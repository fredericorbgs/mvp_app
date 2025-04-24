import os, json, boto3

REGION = os.environ.get("AWS_REGION", "us-east-1")
KB_ID  = os.environ["KB_ID"]
MODEL  = os.environ["MODEL_ARN"]

client = boto3.client("bedrock-agent-runtime", region_name=REGION)

def handler(event, _):
    body = json.loads(event.get("body", "{}"))
    question = body.get("question", "").strip()

    if not question:
        return {"statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "question vazio"})}

    resp = client.retrieve_and_generate(
        input={"text": question},
        retrieveAndGenerateConfiguration={
            "type": "KNOWLEDGE_BASE",
            "knowledgeBaseConfiguration": {
                "knowledgeBaseId": KB_ID,
                "modelArn": MODEL,
                "generationConfiguration": {
                    "inferenceConfig": {
                        "textInferenceConfig": {
                            "temperature": 0.2,
                            "topP": 0.9,
                            "maxTokens": 512
                        }
                    }
                }
            }
        }
    )

    text = resp.get("output", {}).get("text", "")
    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"text": text})
    }

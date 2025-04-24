import os, json, base64, boto3

BUCKET = os.environ["STORAGE_MVPAPP79433F96_BUCKETNAME"]  # gerado pelo Amplify
s3 = boto3.client("s3")

def handler(event, _):
    body = json.loads(event.get("body", "{}"))
    data = base64.b64decode(body["fileContentBase64"])
    key  = body["fileName"]

    s3.put_object(Bucket=BUCKET, Key=key, Body=data)

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"key": key})
    }

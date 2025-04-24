import os, json, boto3
from datetime import datetime

BUCKET = os.environ["STORAGE_MVPAPP79433F96_BUCKETNAME"]
s3 = boto3.client("s3")

def handler(event, _):
    resp = s3.list_objects_v2(Bucket=BUCKET)
    items = [
        {
            "s3_key": o["Key"],
            "nome":   o["Key"],
            "dataUpload": o["LastModified"].isoformat(),
            "tamanho": o["Size"]
        }
        for o in resp.get("Contents", [])
    ]

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps(items)
    }

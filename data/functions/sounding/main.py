import os
import json, gzip
import sounding

import boto3
s3_client = boto3.client('s3')
bucket = 'soundings'


def main():
    data, time = sounding.fetch_all()

    filename = time[:6] + '/sounding-' + time + '.json'
    upload_json_gziped(data, filename)
    upload_json_gziped(data, 'sounding-current.json')



def upload_json_gziped(data, filename):
    filename += '.gz'
    tmpfile = '/tmp/' + os.path.basename(filename)

    with gzip.open(tmpfile, 'w') as f:
        f.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    print('upload: ' + filename)
    s3_client.upload_file(tmpfile, bucket, filename, ExtraArgs={
        'ContentType': 'application/json; charset=utf-8',
        'ACL': 'public-read',
        'ContentEncoding': 'gzip'})


# called by aws lambda
def handler(event, context):
    main()

if __name__ == '__main__':
    main()


"""Serve a JSON feed from a file on your computer or home server."""
import argparse
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import tempfile

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--host',default='127.0.0.1')
parser.add_argument('--port',type=int,default=8765)
parser.add_argument('--file',type=Path,default=Path(__file__).with_name('response.json'))
parser.add_argument('--writable',action='store_true',help='Allow authenticated PUT to replace the JSON file')
args=parser.parse_args()
token=os.environ.get('FEED_TOKEN','')
LIMIT=24576

class Handler(BaseHTTPRequestHandler):
    def response(self,status,value):
        body=json.dumps(value,ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def authorized(self):
        return not token or hmac.compare_digest(self.headers.get('Authorization',''),'Bearer '+token)
    def do_GET(self):
        if not self.authorized():return self.response(401,{'error':'Unauthorized'})
        try:
            if args.file.stat().st_size>LIMIT:return self.response(413,{'error':'Response exceeds 24 KiB'})
            value=json.loads(args.file.read_text(encoding='utf-8'))
        except (OSError,ValueError):return self.response(503,{'error':'Feed file unavailable'})
        self.response(200,value)
    def do_PUT(self):
        if not self.authorized():return self.response(401,{'error':'Unauthorized'})
        if not args.writable:return self.response(405,{'error':'File updates are disabled'})
        try:length=int(self.headers.get('Content-Length','0'))
        except ValueError:return self.response(400,{'error':'Invalid length'})
        if length<1 or length>LIMIT:return self.response(413,{'error':'Body must fit within 24 KiB'})
        try:
            value=json.loads(self.rfile.read(length))
            with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=args.file.parent,delete=False) as stream:
                json.dump(value,stream,ensure_ascii=False,indent=2)
                temporary=stream.name
            os.replace(temporary,args.file)
        except (OSError,ValueError):return self.response(400,{'error':'Cannot update JSON feed'})
        self.response(200,{'result':'ok'})
    def do_POST(self):
        self.response(405,{'error':'Playback and device commands require a connected adapter'})
    def log_message(self,fmt,*values):
        print(fmt%values)

print('Serving JSON on http://'+args.host+':'+str(args.port),flush=True)
HTTPServer((args.host,args.port),Handler).serve_forever()

# Dev helper: serves dist/ and saves PNG snapshots POSTed to /save?name=xxx into ../_snaps
import base64, os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, '..', '_snaps')
os.makedirs(OUT, exist_ok=True)

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=os.path.join(ROOT, 'dist'), **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        q = parse_qs(urlparse(self.path).query)
        name = os.path.basename(q.get('name', ['snap'])[0])
        data = self.rfile.read(int(self.headers['Content-Length'])).decode()
        png = base64.b64decode(data.split(',', 1)[1])
        with open(os.path.join(OUT, name + '.png'), 'wb') as f:
            f.write(png)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')

    def log_message(self, *a):
        pass

ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 5178), H).serve_forever()

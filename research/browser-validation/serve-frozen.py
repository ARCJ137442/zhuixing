"""Serve one hash-verified HTML on loopback only; no directory listing."""
import argparse
import hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("html", type=Path)
    parser.add_argument("--sha256", required=True)
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("port must be in 1024..65535")
    payload = args.html.read_bytes()
    actual = hashlib.sha256(payload).hexdigest()
    if actual.lower() != args.sha256.lower():
        parser.error("HTML SHA256 mismatch; refuse to serve a different artifact")
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path not in ("/", "/index.html"):
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
    print("Frozen HTML SHA256", actual, flush=True)
    server = HTTPServer(("127.0.0.1", args.port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()

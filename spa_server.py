#!/usr/bin/env python3
import http.server
import socketserver
import os

DIST = '/home/user/its-corporate-site/dist'
PORT = 8081

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        path = self.path.split('?')[0]
        file_path = os.path.join(DIST, path.lstrip('/'))
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            self.path = '/index.html'
        super().do_GET()

    def log_message(self, *args):
        pass

with socketserver.TCPServer(('', PORT), SPAHandler) as httpd:
    print(f'Serving SPA on port {PORT}', flush=True)
    httpd.serve_forever()

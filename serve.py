"""
Cyber Portfolio — HTTP/1.1 Server with Range Request support.
Needed for MP4 video scrubbing (browser sets video.currentTime via Range requests).
"""
import http.server
import os
import re
import mimetypes

ROOT = os.path.dirname(os.path.abspath(__file__))


class RangeHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _resolve_path(self):
        path = self.path.split('?', 1)[0]
        path = path.lstrip('/')
        full = os.path.normpath(os.path.join(ROOT, path))
        # safety: don't escape root
        if not full.startswith(ROOT):
            return None
        if os.path.isdir(full):
            full = os.path.join(full, 'index.html')
        return full if os.path.isfile(full) else None

    def do_GET(self):
        full = self._resolve_path()
        if not full:
            self.send_error(404)
            return

        file_size = os.path.getsize(full)
        ctype, _ = mimetypes.guess_type(full)
        if not ctype:
            ctype = 'application/octet-stream'

        range_header = self.headers.get('Range')

        if range_header:
            m = re.match(r'bytes=(\d*)-(\d*)', range_header.strip())
            if not m:
                self.send_error(400, "Bad Range")
                return
            s, e = m.group(1), m.group(2)
            start = int(s) if s else 0
            end   = int(e) if e else file_size - 1
            end   = min(end, file_size - 1)
            if start > end:
                self.send_error(416)
                return
            length = end - start + 1
            self.send_response(206)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            self.send_header('Content-Length', str(length))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()
            self._send_file(full, start, length)
        else:
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(file_size))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()
            self._send_file(full, 0, file_size)

    def do_HEAD(self):
        full = self._resolve_path()
        if not full:
            self.send_error(404)
            return
        file_size = os.path.getsize(full)
        ctype, _ = mimetypes.guess_type(full)
        if not ctype:
            ctype = 'application/octet-stream'
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(file_size))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()

    def _send_file(self, path, start, length):
        try:
            with open(path, 'rb') as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    data = f.read(min(65536, remaining))
                    if not data:
                        break
                    self.wfile.write(data)
                    remaining -= len(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def log_message(self, fmt, *args):
        code = str(args[1]) if len(args) > 1 else '0'
        if code not in ('200', '206', '304'):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    PORT = 4200
    with http.server.ThreadingHTTPServer(('', PORT), RangeHandler) as srv:
        print(f'[CYBER-PORTFOLIO] http://localhost:{PORT}')
        print(f'[CYBER-PORTFOLIO] Range requests: HTTP/1.1 206 — ENABLED')
        srv.serve_forever()

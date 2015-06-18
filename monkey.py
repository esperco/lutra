import SimpleHTTPServer
import SocketServer
import os

class SuffixHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path  = self.path + '.html'
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

PORT = 8009

Handler = SuffixHandler


httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()

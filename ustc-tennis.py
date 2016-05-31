# coding=utf-8
import tornado.web as web
from tornado import gen
from tornado.ioloop import IOLoop
from tornado.web import StaticFileHandler
from tornado.log import enable_pretty_logging
import motor
import os
import json
from bson import ObjectId

enable_pretty_logging()


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)


class UploadHandler(web.RequestHandler):

    @gen.coroutine
    def post(self):
        match_stat = json.loads(self.request.body)
        print match_stat
        self.write('')
        self.finish()

    @gen.coroutine
    def get(self):
        self.write('')
        self.finish()


def make_app(path):
    return web.Application([
        (r"/upload", UploadHandler),
        (r"/", web.RedirectHandler, {'url': 'index.html'}),
        (r"/(.*)", StaticFileHandler, {'path': path}),
    ], db=db)


if __name__ == "__main__":

    static_path = os.path.dirname(os.path.realpath(__file__)) + '/public'
    ip = '127.0.0.1'
    port = 7000

    dbclient = motor.MotorClient(ip, 27017)
    db = dbclient.ustcTennis

    app = make_app(static_path)
    app.listen(port)
    IOLoop.instance().start()

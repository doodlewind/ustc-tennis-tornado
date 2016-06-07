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
import dateutil.parser

enable_pretty_logging()


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)


class FeedHandler(web.RequestHandler):

    @gen.coroutine
    def get(self):
        begin = int(self.get_argument('begin', default=0))
        size = int(self.get_argument('size', default=1))

        match_feeds = []
        cursor = db.match_details.find({}).sort([('started', -1)]).skip(begin)
        for document in (yield cursor.to_list(length=size)):
            feed = dict()
            feed["p1"] = document["p1_name"]
            feed["p2"] = document["p2_name"]
            feed["setsP1"] = document["sets_p1"]
            feed["setsP2"] = document["sets_p2"]
            feed["title"] = document["title"]
            feed["date"] = str(document["started"])
            match_feeds.append(feed)
            print feed
        self.write(JSONEncoder().encode(match_feeds))
        self.finish()

    @gen.coroutine
    def post(self):
        self.write('')
        self.finish()


class UploadHandler(web.RequestHandler):

    @staticmethod
    def update_player_stat(player, player_name, stat):
        if player is None:
            player = dict()
            player["name"] = player_name
            player["first_serve_in"] = int(stat["firstServeIn"])
            player["first_serve_all"] = int(stat["firstServeAll"])
            player["first_serve_won"] = int(stat["firstServeWon"])
            player["second_serve_won"] = int(stat["secondServeWon"])
            player["second_serve_all"] = int(stat["secondServeAll"])
            player["ace"] = int(stat["ace"])
            player["double_fault"] = int(stat["doubleFault"])
            player["winner"] = dict()
            player["winner"]["F"] = int(stat["winner"]["F"])
            player["winner"]["B"] = int(stat["winner"]["B"])
            player["unforced_err"] = dict()
            player["unforced_err"]["F"] = int(stat["unforcedErr"]["F"])
            player["unforced_err"]["B"] = int(stat["unforcedErr"]["B"])
            player["net_point"] = dict()
            player["net_point"]["won"] = int(stat["netPoint"]["won"])
            player["net_point"]["all"] = int(stat["netPoint"]["all"])
            player["break_point"] = dict()
            player["break_point"]["won"] = int(stat["breakPoint"]["won"])
            player["break_point"]["all"] = int(stat["breakPoint"]["all"])
            player["total"] = int(stat["total"])
        else:
            player["first_serve_in"] += int(stat["firstServeIn"])
            player["first_serve_all"] += int(stat["firstServeAll"])
            player["first_serve_won"] += int(stat["firstServeWon"])
            player["second_serve_won"] += int(stat["secondServeWon"])
            player["second_serve_all"] += int(stat["secondServeAll"])
            player["ace"] += int(stat["ace"])
            player["double_fault"] += int(stat["doubleFault"])
            player["winner"]["F"] += int(stat["winner"]["F"])
            player["winner"]["B"] += int(stat["winner"]["B"])
            player["unforced_err"]["F"] += int(stat["unforcedErr"]["F"])
            player["unforced_err"]["B"] += int(stat["unforcedErr"]["B"])
            player["net_point"]["won"] += int(stat["netPoint"]["won"])
            player["net_point"]["all"] += int(stat["netPoint"]["all"])
            player["break_point"]["won"] += int(stat["breakPoint"]["won"])
            player["break_point"]["all"] += int(stat["breakPoint"]["all"])
            player["total"] += int(stat["total"])

        return player

    @gen.coroutine
    def post(self):
        match = json.loads(self.request.body)
        if match["stat"]["title"] is not None:
            match_title = match["stat"]["title"]

            yield db.match_details.save({
                "title": match_title,
                "started": dateutil.parser.parse(match["stat"]["started"]),
                "ended": dateutil.parser.parse(match["stat"]["ended"]),
                "detail": match["progress"],
                "p1_name": match["stat"]["player1"],
                "p2_name": match["stat"]["player2"],
                "p1_stat": match["p1"],
                "p2_stat": match["p2"],
                "sets_p1": match["stat"]["endSetsP1"],
                "sets_p2": match["stat"]["endSetsP2"]
            })

            p1 = yield db.players.find_one({"name":  match["stat"]["player1"]})
            if p1 is not None:
                yield db.players.remove(p1)
            p1 = self.update_player_stat(p1, match["stat"]["player1"], match["p1"])
            yield db.players.save(p1)

            p2 = yield db.players.find_one({"name":  match["stat"]["player2"]})
            if p2 is not None:
                yield db.players.remove(p2)
            p2 = self.update_player_stat(p2, match["stat"]["player2"], match["p2"])
            yield db.players.save(p2)

        self.write('')
        self.finish()

    @gen.coroutine
    def get(self):
        self.write('')
        self.finish()


def make_app(path):
    return web.Application([
        (r"/feed", FeedHandler),
        (r"/upload", UploadHandler),
        (r"/", web.RedirectHandler, {'url': 'index.html'}),
        (r"/(.*)", StaticFileHandler, {'path': path}),
    ], db=db)


if __name__ == "__main__":

    static_path = os.path.dirname(os.path.realpath(__file__)) + '/public'
    ip = '127.0.0.1'
    port = 8979

    dbclient = motor.MotorClient(ip, 27017)
    db = dbclient.ustcTennis

    app = make_app(static_path)
    app.listen(port)
    IOLoop.instance().start()

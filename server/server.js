var map_string =
"TTTTTTTTTTTTTTTTTTTTTTTTT" +
"T~~~~~~~~~~~~~~~~~~~~~~~T" +
"T~~~~~~~~~~~~~~~~~~~~~~~T" +
"T~~~~~~~~~~~~~~~~~~~~~~~T" +
"T~~~~~~~~~~~~~~~~~~~~~~~T" +
"TTT~~~~~~~~...~~~~~~~~TTT" +
"TTTTT~~~~~~...~~~~~~TTTTT" +
"TTTTTTT~~~~...~~~~TTTTTTT" +
"TTTTTTTTT~~~.~~~TTTTTTTTT" +
"TTTTTTTTT~~~.~~~TTTTTTTTT" +
"TTTTTTTTTTTT.TTTTTTTTTTTT" +
"TTTTTTTTTTT...TTTTTTTTTTT" +
"TTTTTTTTTTT...TTTTTTTTTTT" +
"TTTTTTTTTT.....TTTTTTTTTT" +
"TTTTTTTTTT.....TTTTTTTTTT" +
"TTTTTTTTTT.....TTTTTTTTTT" +
"TTTTTTTTTTT...TTTTTTTTTTT" +
"TTTTTTTTTTTT.TTTTTTTTTTTT" +
"TTTTTTTTTTTT.TTTTTTTTTTTT" +
"TTTTTTTTTTTT.TTTTTTTTTTTT";

function string_to_map(s) {
    var map = new Array();
    var map_width = 25;
    var map_height = 20;
    for (y=0; y<map_height; y++) {
        map.push([]);
        for(x=0; x<map_width; x++) {
            var character = s.charAt((y*map_width)+x);
            if (character === "T") {
                map[y].push({
                    type: "tree",
                    solid: true,
                    x: x,
                    y: y
                });
            } else if (character === "~") {
                map[y].push({
                    type: "water",
                    solid: true,
                    x: x,
                    y: y
                });
            } else if (character === ".") {
                map[y].push({
                    type: "ground",
                    solid: false,
                    x: x,
                    y: y
                });
            }
        }
    }
    return map;
}

var map = string_to_map(map_string);

var clients = {};
var players = {};

function game_tick() {
    //console.log("tick");
    for (p in players) {
        var t = players[p].target;
        if (t != null) {
            var dx = 0;
            var dy = 0;
            if (t.x != players[p].x) {
                dx = t.x > players[p].x ? 1 : -1;
            }
            if (t.y != players[p].y) {
                dy = t.y > players[p].y ? 1 : -1;
            }
            players[p].x += dx;
            players[p].y += dy;
            if (players[p].x === t.x && players[p].y === t.y) {
                players[p].target = null;
            }
        }
    }
}

setInterval(game_tick, 15);

var app = require("http").createServer()
  , io = require("socket.io").listen(app)
  , fs = require("fs")

app.listen(8031, "0.0.0.0");

io.sockets.on("connection", function (socket) {
    clients[socket.id] = socket;
    socket.emit("map", map_string);
    socket.emit("populate", {
        players: players,
    });
    socket.on("join", function (data) {
        players[socket.id] = {
            username: socket.id,
            x: 12,
            y: 6,
            target: {x: 12, y: 6}
        };
        for (c in clients) {
            if (c === socket.id) {
                socket.emit("join", players[socket.id]);
            } else {
                clients[c].emit("add_player", players[socket.id]);
            }
        }
    });

    socket.on("move", function(data) {
        players[socket.id].target = data;
        for (c in clients) {
            if (c === socket.id) {
                socket.emit("move", data);
            } else {
                clients[c].emit("move_player", {
                    username: players[socket.id].username,
                    x: data.x,
                    y: data.y
                });
            }
        }
    });
});

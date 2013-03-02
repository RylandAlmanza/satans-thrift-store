window.onload = function () {

    //start crafty
    var GAME_WIDTH = 800;
    var GAME_HEIGHT = 640;
    var SPRITE_SIZE = 32;
    var socket = undefined;

    Crafty.init(GAME_WIDTH, GAME_HEIGHT);
    Crafty.sprite(SPRITE_SIZE, "img/sprites-scaled.png", {
        man: [0, 0],
        skull: [1, 0],
        tree: [0, 1],
        pine: [1, 1],
        water: [0, 2],
        lava: [1, 2],
        salmon: [0, 3],
        sword: [0, 4],
        fishing_pole: [1, 4]
    });

    function parse_map(map_string) {
        var map = new Array();
        var map_width = 25;
        var map_height = 20;
        for (y=0; y<map_height; y++) {
            map.push([]);
            for(x=0; x<map_width; x++) {
                var character = map_string.charAt((y*map_width)+x);
                if (character === "T") {
                    map[y].push(Crafty.e("2D, DOM, tree")
                    .attr({
                        x: x * SPRITE_SIZE,
                        y: y * SPRITE_SIZE,
                        w: SPRITE_SIZE,
                        h: SPRITE_SIZE
                    }));
                } else if (character === "~") {
                    map[y].push(Crafty.e("2D, DOM, water")
                    .attr({
                        x: x * SPRITE_SIZE,
                        y: y * SPRITE_SIZE,
                        w: SPRITE_SIZE,
                        h: SPRITE_SIZE
                    }));
                } else if (character === ".") {
                    map[y].push(undefined);
                }
            }
        }
        return map;
    }

    Crafty.scene("loading", function() {
        Crafty.background("#000");
        Crafty.e("2D, DOM, Text")
        .attr({
            w: 100,
            h: 20,
            x: 150,
            y: 120
        })
        .text("Loading")
        .css({"text-align": "center"});
        Crafty.load(["img/sprites-scaled.png"], function() {
            Crafty.scene("main");
        });
    });

    Crafty.scene("main", function() {
        Crafty.background("#000");
        var player = undefined;
        var remote_players = {};
        var items = {};
        var map = undefined;

        socket = io.connect("76.105.244.177:8031");
        socket.on("map", function(data) {
            map = parse_map(data);
            //socket.emit("join", {});
        });

        socket.on("join", function(data) {
            player = Crafty.e("2D, DOM, man, CustomControls, Target")
            .attr({
                x: data.x,
                y: data.y,
                w: SPRITE_SIZE,
                h: SPRITE_SIZE,
                username: data.username,
                target: data.target
            });
            //player.CustomControls();
            player.Target();
            Crafty.addEvent(this, Crafty.stage.elem, "mousedown", function(e) {
                //console.log(e);
                if (e.button == 0) {
                    //console.log("left");
                    socket.emit("move", {x: e.layerX, y: e.layerY});
                    //console.log(e.layerX, e.layerY);
                }
            });
        });
        
        socket.on("populate", function(data) {
            console.log(data);
            for (i in data.players) {
                console.log(i);
                remote_players[i] = Crafty.e("2D, DOM, man, Target")
                .attr({
                    x: data.players[i].x,
                    y: data.players[i].y,
                    w: SPRITE_SIZE,
                    h: SPRITE_SIZE,
                    username: data.players[i].username,
                    target: data.players[i].target,
                });
                remote_players[i].Target();
            }
            socket.emit("join", {});
        });

        socket.on("add_player", function(data) {
            remote_players[data.username] = Crafty.e("2D, DOM, man, Target")
            .attr({
                x: data.x,
                y: data.y,
                w: SPRITE_SIZE,
                h: SPRITE_SIZE,
                username: data.username,
                target: data.target
            });
            remote_players[data.username].Target();
        });

        socket.on("move", function(data) {
            player.target = data;
        });

        socket.on("move_player", function(data) {
            remote_players[data.username].target = {x: data.x, y: data.y};
        });
    });


    /*Crafty.c("CustomControls", {
        CustomControls: function() {
            Crafty.bind("mousedown", function(e) {
                console.log(e);
                if (e.mouseButton == Crafty.mouseButtons.LEFT) {
                    console.log("left");
                    socket.emit("move", {x: e.x, y: e.y});
                    console.log(e.x, e.y);
                }
            });
        }
    });*/

    Crafty.c("Target", {
        Target: function() {
            this.bind("EnterFrame", function() {
                var t = this.target;
                //console.log(t);
                if (t != null) {
                    //console.log(t.x, t.y);
                    var dx = 0;
                    var dy = 0;
                    if (t.x != this.x) {
                        dx = t.x > this.x ? 1 : -1;
                    }
                    if (t.y != this.y) {
                        dy = t.y > this.y ? 1 : -1;
                    }
                    this.x += dx;
                    this.y += dy;
                    if (this.x === t.x && this.y === t.y) {
                        this.target = null;
                    }
                }
            });
        }
    });

    Crafty.scene("loading");
}

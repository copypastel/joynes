// BSD licensed, rock along with it.

var util = require('util');
//var connect = require('connect');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

app.listen(3333);

app.configure( function(){
  app.use(express.static(__dirname + '/public'));
});

app.get('/:id?', function(req, res){
  res.render('index.ejs');
});

var channels = {};
var waiting = [];

/* When a player connects, they join the waiting FIFO queue.
 * Once we have two players, we'll automatically pair them,
 * with the older player becoming player one.
 */
io.sockets.on("connection", function(player){
  util.log(player.id + " connected.");

  player.on("pair", function(partnerId) {
    util.log(player.id + " wants to pair!");
    var partner = getPlayer(partnerId);
    if (partner != undefined) {
      util.log("Attempting to pair " + player.id + " to " + partner.id);
      pair(player, partner);
    } else {
      waiting.push(player);
      if (waiting.length >= 2) {
        /* Pair the top two; this means our waiting queue should never
         * grow larger than 2
         */
        pair(waiting.shift(), waiting.shift());
      }
    }
  }

  player.on("unpair", function() {
    purge(player.id);
  }

  /* After pairing, we're just acting as a proxy for messages
   * between the two players */
  player.on("message", function(message){
    util.log("Got message: " + message);
    if(channels[player.id] != undefined){
      util.log("Sending " + message + " from " + player.id + " to " + channels[player.id].id);
      partner = channels[player.id];
      partner.send(message);
    } else {
      util.debug("Player " + player.id + " sent a message while not paired.");
    }
  });
});

io.sockets.on("disconnect", function(player){
  util.log("Player "  + player.id + " has left the arcade.");
  if( channels[conn.id] != undefined ){
    var partner = channels[conn.id];
    /* Let the partner know they're now alone */
    partner.send(JSON.stringify({close: player.id}));
    purge(player);
  }else{
    /* Player was in the waiting list; we need to purge him. */
    purge(player);
  }
});

/* player and partner are websocket connections */
var pair = function(player, partner) {
  channels[player.id] = partner;
  channels[partner.id] = player;

  util.log("Pairing players " + player.id + " & " + partner.id);

  /* Let the players know their roles: master/slave */
  player.emit("role", JSON.stringify({initialize: "m"}));
  partner.emit("role", JSON.stringify({initialize: "s"}));
}

/* We know all pairs, so we only need one player
 * to unpair */
var unpair = function(player) {
  /* Dissolve pair */
  var partner = channels[player.id];
  channels[player.id] = undefined;

  if (partner != undefined) {
    /* Put partner in the waiting queue */
    channels[partner.id] = undefined;
    waiting.push(partner);
  } else {
    util.debug("Tried to unpair solitary player " + player.id);
  }
}

/* Unpair the player, and remove her from the waiting list */
var purge = function(player) {
  unpair(player);
  for (i in waiting) {
    if (waiting[i].id == player.id) {
      waiting.splice(i,1);
      break;
    } else {
      continue;
    }
  }
}

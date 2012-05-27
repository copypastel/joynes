// BSD licensed, rock along with it.

var util = require('util');
//var connect = require('connect');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

io.configure('production', function() {
  io.set('log level', 1);
});

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
 *
 * Secret is to keep in mind that players are websocket
 * connection objects.
 */
io.sockets.on("connection", function(player){
  util.log(player.id + " connected.");

  player.on("register:m", function() {
    player.emit("role", {initialize: "m"});
  });
  player.on("register:s", function(partnerId) {
    // if player with partnerId is already paired, ignore request
    // TODO: return an error
    var partnerAlreadyPaired = getPartner(partnerId);
    if(partnerAlreadyPaired) {
      return;
    }
    util.log(player.id + " wants to pair!");
    var partner = getPlayer(partnerId);
    // If there is a player with the given partnerId, let's pair 'em
    if (partner != undefined) {
      // partner is actually player 1
      pair(player, partner);
      player.emit("role", {initialize: "s"});
      //TODO: Investigate race condition.  Master processes partner joined before slave finishes initializing
      partner.emit("state:partner_joined", partner.id);
    } else {
      // couldn't find a player given a partnerId;
      // might prefer to throw an error in this case...
      waiting.push(player);
      if (waiting.length >= 2) {
        /* Pair the top two; this means our waiting queue should never
         * grow larger than 2
         */
        pair(waiting.shift(), waiting.shift());
      }
    }
  });

  player.on("unpair", function() {
    purge(player.id);
  });

  /* After pairing, we're just acting as a proxy for messages
   * between the two players */

  player.on("message", function(message){
    //util.log("Got message: " + message);
    var partner = getPartner(player.id);
    if(partner != undefined){
      partner.send(message);
    } else {
      // util.debug("Player " + player.id + " sent a message while not paired.");
    }
  });

  player.on("proxy", function(data){
    var partner = getPartner(player.id);
    if(partner != undefined){
      partner.emit(data['command'], data['data']);
    } else {
      // util.debug("!! Tried sending message to ghost partner");
    }
  });
});

io.sockets.on("disconnect", function(player){
  util.log("Player "  + player.id + " has left the arcade.");
  var partner = getPartner(player.id);
  if( partner != undefined ){
    /* Let the partner know they're now alone */
    partner.send(JSON.stringify({close: player.id}));
    purge(player);
  }else{
    /* Player was in the waiting list; we need to purge him. */
    purge(player);
  }
});

var getPlayer = function(playerId) {
  return io.sockets.sockets[playerId];
}

var getPartner = function(playerId) {
  return channels[playerId];
}

/* player and partner are websocket connections */
var pair = function(player, partner) {
  channels[player.id] = partner;
  channels[partner.id] = player;

  util.log("Pairing players " + player.id + " & " + partner.id);

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

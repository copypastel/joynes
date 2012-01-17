// BSD licensed, rock along with it.

var util = require('util');
//var connect = require('connect');
var express = require('express');
//  var io = require('socket.io');
var ws = require('./ws');
var app = express.createServer();
var socket = ws.createServer();

// Config

// App

app.configure( function(){
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
  res.render('index.ejs');
});

app.get('/master', function(req, res){
  res.render('master.ejs');
});

app.get('/slave', function(req, res){
  res.render('slave.ejs');
});

var channels = {};
var waiting = [];

/* When a player connects, they join the waiting FIFO queue.
 * Once we have two players, we'll automatically pair them,
 * with the older player becoming player one.
 */
socket.addListener("connection", function(player){
  waiting.push(player);
  if (waiting.length >= 2) {
    /* Pair the top two; this means our waiting queue should never
     * grow larger than 2
     */
    pair(waiting.shift(), waiting.shift());
  } else {
    util.log("Player " + player.id + " is waiting for a partner.");
    false;
  }

  /* After pairing, we're just acting as a proxy for messages
   * between the two players */
  player.addListener("message", function(message){
    if(channels[player.id] != undefined){
      util.log("Sending " + message + " from " + player.id + " to " + channels[player.id].id);
      send(player, message);
    } else {
      util.debug("Player " + player.id + " sent a message while not paired.");
    }
  });
});

socket.addListener("close", function(player){
  util.log("Player "  + player.id + " has left the arcade.");
  if( channels[conn.id] != undefined ){
    var partner = channels[conn.id];
    /* Let the partner know they're now alone */
    socket.send(partner.id, JSON.stringify({close: player.id}));
    purge(player);
  }else{
    /* Player was in the waiting list; we need to purge him. */
  }
});

/* player and partner are websocket connections */
var pair = function(player, partner) {
  channels[player.id] = partner;
  channels[partner.id] = player;

  util.log("Pairing players " + player.id + " & " + partner.id);

  /* Let the players know their roles: master/slave */
  player.send(JSON.stringify({initialize: "m"}));
  partner.send(JSON.stringify({initialize: "s"}));
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

var send = function(sender, message) {
  socket.send(channels[sender.id], message);
}

socket.listen(8080);
app.listen(3333);

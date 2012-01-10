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
var mastersWaiting = [];
var slavesWaiting = [];

socket.addListener("connection", function(conn){
  util.puts("Opening: " + conn.id);
  conn.addListener("message", function(message){
    if(message[0] == "m"){
      // Master
      util.puts("Master " + conn.id + " connected.")
      if( slavesWaiting.length == 0){
        mastersWaiting.push(conn.id);
      }else{
        // Have a pair.
        var slave = slavesWaiting.shift();
        var master = conn.id
        channels[master] = slave;
        channels[slave] = master;
      };
    }
    else if(message[0] == "s"){
      // Slave
      util.puts("Slave " + conn.id + " connected.")
      if( mastersWaiting.length == 0){
        slavesWaiting.push(conn.id);
      }else{
        // Have a pair.
        var master = mastersWaiting.shift();
        var slave = conn.id;
        util.puts("Matching slave " + conn.id + " with master " + master);
        channels[master] = slave;
        channels[slave] = master;
      }
    }else{
      // Try to send message
      if(channels[conn.id] != undefined){
        util.puts("Sending " + message + " from " + conn.id + " to " + channels[conn.id]);
        socket.send(channels[conn.id], message);
      }
    }
  });
});

socket.addListener("close", function(conn){
  util.puts("Closing: " + conn.id);
  if( channels[conn.id] != undefined ){
    var partner = channels[conn.id];
    socket.send(partner, JSON.stringify({close: conn.id}));
    channels[conn.id] = undefined;
    channels[partner] = undefined;
    // need to put partner in waiting list.
  }else{
    // was in a waiting list.
  }
});

socket.listen(8080);
app.listen(3333);

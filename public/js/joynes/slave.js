joynes.Slave.prototype = {
  initialize: function(nes, socket) {
    var self = this;
    this.nes = nes;
    this.socket = socket;
    this.socket.on("connection", function(evt){
      self.socket.send(JSON.stringify({ok: 1}));
    });

    this.socket.on("message", function(evt){
      self.nes.ui.writeFrame(JSON.parse(evt));
      self.socket.send(JSON.stringify({ok: 1}));
    });

    /* TODO: we should only preventDefault for non-controller keys. */
    $(document).
    bind('keydown', function(evt) {
      self.sendKey(evt.keyCode, 0x41);
    }).
    bind('keyup', function(evt) {
      self.sendKey(evt.keyCode, 0x40);
    }).
    bind('keypress', function(evt) {
        evt.preventDefault()
    });

  },
  sendKey: function(key, value){
      switch (key) {
          case 88: this.socket.send(JSON.stringify({key: 103,  value: value})); break;
          case 90: this.socket.send(JSON.stringify({key: 105,  value: value})); break;
          case 17: this.socket.send(JSON.stringify({key: 99,   value: value})); break;
          case 13: this.socket.send(JSON.stringify({key: 97,   value: value})); break;
          case 38: this.socket.send(JSON.stringify({key: 104,  value: value})); break;
          case 40: this.socket.send(JSON.stringify({key: 98,   value: value})); break;
          case 37: this.socket.send(JSON.stringify({key: 100,  value: value})); break;
          case 39: this.socket.send(JSON.stringify({key: 102,  value: value})); break;
          default: return true;
      }
      return false; // preventDefault
  }
}

$.extend(joynes.Slave.prototype,  joynes.Base.prototype);

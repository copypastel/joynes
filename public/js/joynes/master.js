joynes.Master.prototype = {
  initialize: function(nes, socket) {
    var self = this;
    this.socket = socket;
    this.nes = nes;

    this.lastSendTime = null;

    this.nes.ui.romSelect.unbind('change');
    this.nes.ui.romSelect.bind('change', function(){
      self.loadRom(self.nes.ui.romSelect.val());
    });

    this.socket.on("message", function(evt){
      var data = JSON.parse(evt);
      if(data.close) { self.setFrameRate(60); return }
      if(data.key)   { self.nes.keyboard.setKey(data.key, data.value) }
      if(data.ok)    {
        self.calculateFrameRate();
        self.socket.send(self.nes.ui.prevBuffer);
      }

    }
  },
  setFrameRate: function(rate){
    this.nes.setFramerate(rate);
  },
  calculateFrameRate: function() {
    var now = Date.now();
    if(!self.lastSendTime) { self.lastSendTime = now; }
    else {
      var frameRate = 1/(now - self.lastSendTime) * 1000;
      //console.log(frameRate);
      if(frameRate < 15){ frameRate = 15 }
      else if(frameRate > 60){ frameRate = 60 };
      // Set to frameRate + 1 so we can increase until reaching limit.
      self.setFrameRate(frameRate + 1);
    }
    self.lastSendTime = now;
  }
}

$.extend(joynes.Master.prototype, joynes.Base.prototype);

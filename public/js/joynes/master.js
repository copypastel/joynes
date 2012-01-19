joynes.Master.prototype = {
  initialize: function(nes, socket) {
    var self = this;
    this.socket = socket;
    this.nes = nes;
    self.instruction_id = 0;
    self.startRom = true;
    
    this.lastSendTime = null;

    this.nes.ui.romSelect.unbind('change');
    this.nes.ui.romSelect.bind('change', function(){
      self.loadRom(self.nes.ui.romSelect.val());
      self.partner("Rom:Changed", self.nes.ui.romSelect.val());
    });
    
    self.socket.on("PPU:Read", function() {
      self.partner("PPU:Write", {"instruction": self.instruction_id, "ppu": self.nes.ppu.buffer});
      self.partner("PPU:Instruction", {"instruction_id": self.instruction_id, "instruction_enum": "startVBlank"});
    })

    this.socket.on("message", function(evt){
      var data = JSON.parse(evt);
      if(data.close) { self.setFrameRate(60); return }
      if(data.key)   { self.nes.keyboard.setKey(data.key, data.value) }
    });
  },
  setFrameRate: function(rate){
    this.nes.setFramerate(rate);
  },
  calculateFrameRate: function() {
    var now = Date.now();
    var self = this;
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

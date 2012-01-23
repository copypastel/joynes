joynes.Master.prototype = {
  initialize: function(nes, socket) {
    var self = this;
    this.socket = socket;
    this.nes = nes;
    self.instruction_id = 0;
    self.frame_instructions = [];
    self.startRom = true;
    self.sramBuffer = new Array(256);
    self.syncPPU = false;
    self.syncFrame = false;
    self.debug = false;
    
    this.lastSendTime = null;

    this.nes.ui.romSelect.unbind('change');
    this.nes.ui.romSelect.bind('change', function(){
      self.loadRom(self.nes.ui.romSelect.val());
      self.partner("Rom:Changed", self.nes.ui.romSelect.val());
    });
    
    self.socket.on("PPU:Sync", function() {
      self.syncPPU = true;
    })

    this.socket.on("message", function(evt){
      var data = JSON.parse(evt);
      if(data.close) { self.setFrameRate(60); return }
      if(data.key)   { self.nes.keyboard.setKey(data.key, data.value) }
    });
        
    self.ppuEndFrame = self.nes.ppu.endFrame;
    self.nes.ppu.endFrame = function() { self.endFrame() };
    
    self.ppuScrollWrite = self.nes.ppu.scrollWrite;
    self.nes.ppu.scrollWrite = function(value) { self.scrollWrite(value) };
    
    self.ppuWriteSRAMAddress = self.nes.ppu.writeSRAMAddress;
    self.nes.ppu.writeSRAMAddress = function(value) { self.writeSRAMAddress(value) };
    
    self.ppuSramDMA = self.nes.ppu.sramDMA;
    self.nes.ppu.sramDMA = function(value) { self.sramDMA(value) };
    
    self.ppuEndScanline = self.nes.ppu.endScanline;
    self.nes.ppu.endScanline = function(value){ self.endScanline() };
  },
  
  endFrame: function() {
    console.log("endFrame");
    var self = this;
    
    self.ppuEndFrame.call(self.nes.ppu);
    
    if(self.syncPPU) {
      self.partner("PPU:Initialize", {
        "instruction": self.instruction_id + 1, 
        "ppu": self.nes.ppu.buffer,
        "controlReg1Value": self.nes.ppu.controlReg1Value,
        "controlReg2Value": self.nes.ppu.controlReg2Value,
        "cntV": self.nes.ppu.cntV,
        "cntH": self.nes.ppu.cntH,
      });
      self.syncPPU   = false
      self.syncFrame = true;
    }
    else if(self.syncFrame) {
      console.log("syncing frame");
      self.partner("PPU:Frame", {"instruction": self.instruction_id, "frame_instructions": self.frame_instructions})
    }
    else {
      if(self.debug) {
        console.log(self.frame_instructions);
        console.log("Would have sent... " + self.frame_instructions.length);
        console.log(self.frame_instructions);
      }
    }
    
    this.frame_instructions = [];
    self.instruction_id += 1;
    
  },
  
  scrollWrite: function(value) {
    var self = this;
    self.ppuScrollWrite.call(self.nes.ppu, value);
    var instruction = {"enum": "scrollWrite", "value": value}
    self.frame_instructions.push(instruction)
  },
  
  writeSRAMAddress: function(value) {
    var self = this;
    self.ppuWriteSRAMAddress.call(self.nes.ppu, value)
    var instruction = {"enum": "writeSRAMAddress", "value": value}
    self.frame_instructions.push(instruction)
  },
  
  sramDMA: function(value) {
    var self = this;
    if(self.nes.ppu.debug) { console.log("sramDMA")  }
    var baseAddress = value * 0x100;
    var data;
    
    for (var i=self.nes.ppu.sramAddress; i < 256; i++) {
        data = this.nes.cpu.mem[baseAddress+i];
        self.sramBuffer[i] = self.nes.ppu.spriteMem[i] = data;
        self.nes.ppu.spriteRamWriteUpdate(i, data);
    }
    // Assuming we only receive 1 sramDMA per screen cycle, need to verify this
    var instruction = {
      "enum": "sramDMA",
      "value": value,
      "data": self.sramBuffer,
    };
    
    self.frame_instructions.push(instruction)
    self.nes.cpu.haltCycles(513);
  },
  
  endScanline: function() {
    var self = this;
    this.ppuEndScanline.call(this.nes.ppu);
    var instruction = { "enum": "endScanline" };
    this.frame_instructions.push(instruction);    
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

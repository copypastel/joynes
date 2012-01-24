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
    var self = this;
    
    self.ppuEndFrame.call(self.nes.ppu);
    
    if(self.syncPPU) {
      this.nes.ppu.ptTile[1].initialized = true;
      console.log(this.nes.ppu.ptTile[1])
      self.partner("PPU:Initialize", {
        "instruction": self.instruction_id + 1, 
        "vramMem": this.nes.ppu.vramMem,
        "spriteMem": this.nes.ppu.spriteMem,
        "vramAddress": this.nes.ppu.vramAddress,
        "vramTmpAddress": this.nes.ppu.vramTmpAddress,
        "vramBufferedReadValue": this.nes.ppu.vramBufferedReadValue,
        "firstWrite": this.nes.ppu.firstWrite,
        "sramAddress": this.nes.ppu.sramAddress,
        "mapperIrqCounter": this.nes.ppu.mapperIrqCounter,
        "currentMirroring": this.nes.ppu.currentMirroring,
        "requestEndFrame": this.nes.ppu.requestEndFrame,
        "nmiOk": this.nes.ppu.nmiOk,
        "dummyCycleToggle": this.nes.ppu.dummyCycleToggle,
        "validTileData": this.nes.ppu.validTileData,
        "nmiCounter": this.nes.ppu.nmiCounter,
        "scanlineAlreadyRendered": this.nes.ppu.scanlineAlreadyRendered,
        "f_nmiOnVblank": this.nes.ppu.f_nmiOnVblank,
        "f_spriteSize": this.nes.ppu.f_spriteSize,
        "f_bgPatternTable": this.nes.ppu.f_bgPatternTable,
        "f_spPatternTable": this.nes.ppu.f_spPatternTable,
        "f_addrInc": this.nes.ppu.f_addrInc,
        "f_nTblAddress": this.nes.ppu.f_nTblAddress,
        "f_color": this.nes.ppu.f_color,
        "f_spVisibility": this.nes.ppu.f_spVisibility,
        "f_bgVisibility": this.nes.ppu.f_bgVisibility,
        "f_spClipping": this.nes.ppu.f_spClipping,
        "f_bgClipping": this.nes.ppu.f_bgClipping,
        "f_dispType": this.nes.ppu.f_dispType,
        "cntFV": this.nes.ppu.cntFV,
        "cntV": this.nes.ppu.cntV,
        "cntH": this.nes.ppu.cntH,
        "cntVT": this.nes.ppu.cntVT,
        "cntHT": this.nes.ppu.cntHT,
        "regFV": this.nes.ppu.regFV,
        "regV": this.nes.ppu.regV,
        "regH": this.nes.ppu.regH,
        "regVT": this.nes.ppu.regVT,
        "regHT": this.nes.ppu.regHT,
        "regFH": this.nes.ppu.regFH,
        "regS": this.nes.ppu.regS,
        "curNt": this.nes.ppu.curNt,
        "attrib": this.nes.ppu.attrib,
        "buffer": this.nes.ppu.buffer,
        "bgbuffer": this.nes.ppu.bgbuffer,
        "pixrendered": this.nes.ppu.pixrendered,
        "spr0dummybuffer": this.nes.ppu.spr0dummybuffer,
        "dummyPixPriTable": this.nes.ppu.dummyPixPriTable,
        "validTileData": this.nes.ppu.validTileData,
        "scantile": this.nes.ppu.scantile,
        "scanline": this.nes.ppu.scanline,
        "lastRenderedScanline": this.nes.ppu.lastRenderedScanline,
        "curX": this.nes.ppu.curX,
        "sprX": this.nes.ppu.sprX,
        "sprY": this.nes.ppu.sprY,
        "sprTile": this.nes.ppu.sprTile,
        "sprCol": this.nes.ppu.sprCol,
        "vertFlip": this.nes.ppu.vertFlip,
        "horiFlip": this.nes.ppu.horiFlip,
        "bgPriority": this.nes.ppu.bgPriority,
        "spr0HitX": this.nes.ppu.spr0HitX,
        "spr0HitY": this.nes.ppu.spr0HitY,
        "hitSpr0": this.nes.ppu.hitSpr0,
        "sprPalette": this.nes.ppu.sprPalette,
        "imgPalette": this.nes.ppu.imgPalette,
        "ptTile": this.nes.ppu.ptTile,
        "ntable1": this.nes.ppu.ntable1,
        "currentMirroring": this.nes.ppu.currentMirroring,
        "nameTable": this.nes.ppu.nameTable,
        "vramMirrorTable": this.nes.ppu.vramMirrorTable,
        "palTable": this.nes.ppu.palTable,
        "controlReg1Value": this.nes.ppu.controlReg1Value,
        "controlReg2Value": this.nes.ppu.controlReg2Value,
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

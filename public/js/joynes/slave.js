joynes.Slave.prototype = {
  initialize: function(nes, socket) {
    var self = this;
    
    self.nes = nes;
    self.socket = socket;
    self.current_instruction = 0;
    self.startRom = false;
    
    self.socket.on("connection", function(evt){
      self.socket.send(JSON.stringify({ok: 1}));
    });
    
    self.socket.on("Rom:Changed", function(rom_location) {
      self.nes.ppu.reset();
      self.loadRom(rom_location);
      //self.partner("PPU:Sync")
    });
    
    self.socket.on("PPU:Initialize", function(data) {      
      self.nes.ppu.vramMem = data["vramMem"];
      self.nes.ppu.spriteMem = data["spriteMem"];
      self.nes.ppu.vramAddress = data["vramAddress"];
      self.nes.ppu.vramTmpAddress = data["vramTmpAddress"];
      self.nes.ppu.vramBufferedReadValue = data["vramBufferedReadValue"];
      self.nes.ppu.firstWrite = data["firstWrite"];
      self.nes.ppu.sramAddress = data["sramAddress"];
      self.nes.ppu.mapperIrqCounter = data["mapperIrqCounter"];
      self.nes.ppu.currentMirroring = data["currentMirroring"];
      self.nes.ppu.requestEndFrame = data["requestEndFrame"];
      self.nes.ppu.nmiOk = data["nmiOk"];
      self.nes.ppu.dummyCycleToggle = data["dummyCycleToggle"];
      self.nes.ppu.validTileData = data["validTileData"];
      self.nes.ppu.nmiCounter = data["nmiCounter"];
      self.nes.ppu.scanlineAlreadyRendered = data["scanlineAlreadyRendered"];
      self.nes.ppu.f_nmiOnVblank = data["f_nmiOnVblank"];
      self.nes.ppu.f_spriteSize = data["f_spriteSize"];
      self.nes.ppu.f_bgPatternTable = data["f_bgPatternTable"];
      self.nes.ppu.f_spPatternTable = data["f_spPatternTable"];
      self.nes.ppu.f_addrInc = data["f_addrInc"];
      self.nes.ppu.f_nTblAddress = data["f_nTblAddress"];
      self.nes.ppu.f_color = data["f_color"];
      self.nes.ppu.f_spVisibility = data["f_spVisibility"];
      self.nes.ppu.f_bgVisibility = data["f_bgVisibility"];
      self.nes.ppu.f_spClipping = data["f_spClipping"];
      self.nes.ppu.f_bgClipping = data["f_bgClipping"];
      self.nes.ppu.f_dispType = data["f_dispType"];
      self.nes.ppu.cntFV = data["cntFV"];
      self.nes.ppu.cntV = data["cntV"];
      self.nes.ppu.cntH = data["cntH"];
      self.nes.ppu.cntVT = data["cntVT"];
      self.nes.ppu.cntHT = data["cntHT"];
      self.nes.ppu.regFV = data["regFV"];
      self.nes.ppu.regV = data["regV"];
      self.nes.ppu.regH = data["regH"];
      self.nes.ppu.regVT = data["regVT"];
      self.nes.ppu.regHT = data["regHT"];
      self.nes.ppu.regFH = data["regFH"];
      self.nes.ppu.regS = data["regS"];
      self.nes.ppu.curNt = data["curNt"];
      self.nes.ppu.attrib = data["attrib"];
      self.nes.ppu.buffer = data["buffer"];
      self.nes.ppu.bgbuffer = data["bgbuffer"];
      self.nes.ppu.pixrendered = data["pixrendered"];
      self.nes.ppu.spr0dummybuffer = data["spr0dummybuffer"];
      self.nes.ppu.dummyPixPriTable = data["dummyPixPriTable"];
      self.nes.ppu.validTileData = data["validTileData"];
      self.nes.ppu.scantile = data["scantile"];
      self.nes.ppu.scanline = data["scanline"];
      self.nes.ppu.lastRenderedScanline = data["lastRenderedScanline"];
      self.nes.ppu.curX = data["curX"];
      self.nes.ppu.sprX = data["sprX"];
      self.nes.ppu.sprY = data["sprY"];
      self.nes.ppu.sprTile = data["sprTile"];
      self.nes.ppu.sprCol = data["sprCol"];
      self.nes.ppu.vertFlip = data["vertFlip"];
      self.nes.ppu.horiFlip = data["horiFlip"];
      self.nes.ppu.bgPriority = data["bgPriority"];
      self.nes.ppu.spr0HitX = data["spr0HitX"];
      self.nes.ppu.spr0HitY = data["spr0HitY"];
      self.nes.ppu.hitSpr0 = data["hitSpr0"];
      self.nes.ppu.sprPalette = data["sprPalette"];
      self.nes.ppu.imgPalette = data["imgPalette"];
      for(var i in data["ptTile"]) {
        $.extend(self.nes.ppu.ptTile[i], data["ptTile"][i]);
      }
      self.nes.ppu.ntable1 = data["ntable1"];
      self.nes.ppu.currentMirroring = data["currentMirroring"];
      for(var i in data["nameTable"]) {
        $.extend(self.nes.ppu.nameTable[i], data["nameTable"][i])
      }
      self.nes.ppu.vramMirrorTable = data["vramMirrorTable"];

      self.nes.ppu.updateControlReg1(data['controlReg1Value']);
      self.nes.ppu.updateControlReg2(data['controlReg2Value']);
      self.nes.ppu.startVBlank();

      self.current_instruction = data['instruction'];
      console.log("Waiting for instruction " + self.current_instruction)
    });
    
    self.socket.on("PPU:Frame", function(data) {
      if(self.current_instruction == data['instruction'] ) {
        self.nes.ppu.startFrame();
        self.renderFrame(data['frame_instructions']);
        self.nes.ppu.startVBlank();
      }
      self.current_instruction += 1;
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
  },
  
  renderFrame: function(instructions) {
    var self = this;
    for(i in instructions) {
      instruction = instructions[i]
      switch (instruction['enum']) {
        case 'sramDMA': 
          self.sramDMA(instruction['value'], instruction['data']);
        break;
        case 'scrollWrite':
          self.scrollWrite(instruction['value']);
        break;
        case 'writeSRAMAddress':
          self.writeSRAMAddress(instruction['value']);
        break;
        case 'endScanline':
          self.endScanline();
        break;
        case 'loadVromBank':
          self.loadVromBank(instruction['bank'], instruction['address']);
        break;
        case 'setSprite0HitFlag':
          self.setSprite0HitFlag();
        break;
      }
    }
  },
  
  scrollWrite: function(value) {
    this.nes.ppu.scrollWrite(value);
  },
  
  writeSRAMAddress: function(value) {
    this.nes.ppu.writeSRAMAddress(value);
  },
  
  endScanline: function() {
    this.nes.ppu.endScanline();
  },
  
  loadVromBank: function(bank, address) {
    this.nes.mmap.loadVromBank(bank, address)
  },
  
  // CPU Register $4014:
  // Write 256 bytes of main memory
  // into Sprite RAM.
  sramDMA: function(value, datum) {
    var self = this, 
        data;
    
    for (var i=self.nes.ppu.sramAddress; i < 256; i++) {
        data = datum[i];
        self.nes.ppu.spriteMem[i] = data;
        self.nes.ppu.spriteRamWriteUpdate(i, data);
    }
  },
  
  setSprite0HitFlag: function() {
    this.nes.ppu.setSprite0HitFlag();
  }
}

$.extend(joynes.Slave.prototype,  joynes.Base.prototype);

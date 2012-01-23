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
      self.loadRom(rom_location);
      //self.partner("PPU:Sync")
    });
    
    self.socket.on("PPU:Initialize", function(data) {
      self.nes.ppu.updateControlReg1(data['controlReg1Value']);
      self.nes.ppu.updateControlReg2(data['controlReg2Value']);
      self.nes.ppu.buffer = data['ppu'];
      self.nes.ppu.cntV = data['cntV'];
      self.nes.ppu.cntH = data['cntH'];
      
      self.nes.ppu.startVBlank();

      self.current_instruction = data['instruction'];
      console.log("Waiting for instruction " + self.current_instruction)
    });
    
    self.socket.on("PPU:Frame", function(data) {
      console.log("Received instruction" + data['instruction'])
      if(self.current_instruction == data['instruction'] ) {
        console.log("Parsing the data");
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
  }
}

$.extend(joynes.Slave.prototype,  joynes.Base.prototype);

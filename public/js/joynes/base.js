joynes.Base.prototype = {
  INSTRUCTIONS: {
    sramDMA: 0,
    scrollWrite: 1,
    writeSRAMAddress: 2,
    sramDMA: 3,
    scrollWrite: 4,
    writeSRAMAddress: 5,
    endScanLine: 6,
    loadVromBank: 7,
    load1kVromBank: 8,
    load2kVromBank: 9,
    mmapWrite: 10,
    updateControlReg1: 11,
    updateControlReg2: 12,
    setSprite0HitFlag: 13,
    sramWrite: 14,
    writeVRAMAddress: 15,
    vramWrite: 16,
    readStatusRegister: 17,
  },

  compressor : LZMA,

  partner : function(command, data) {
    var self = this;
    self.socket.emit("proxy", {"command": command, "data": data })
  },

  loadRom : function(url, callback) {
    var self = this;

    $.ajax( {
      url: escape(url),
      xhr: function() {
        var xhr = $.ajaxSettings.xhr();
        // Download as binary
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        return xhr;
      },
      success: function(data) { self.loadRomData(data); if(callback) { callback() }  }
    })
  },

  loadRomData: function(data) {
    this.nes.loadRom(data);
    if(this.startRom) { this.nes.start() }
    this.nes.ui.enable();
  },

  onRomLoaded: function() {},
};


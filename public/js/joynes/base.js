joynes.Base.prototype = {
  
  partner : function(command, data) {
    var self = this;
    self.socket.emit("proxy", {"command": command, "data": data })
  },
  
  loadRom : function(url) {
    var self = this;

    $.ajax( {
      url: escape(url),
      xhr: function() {
        var xhr = $.ajaxSettings.xhr();
        // Download as binary
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        return xhr;
      },
      success: function(data) { self.loadRomData(data); }
    })
  },

  loadRomData: function(data) {
    this.nes.loadRom(data);
    if(this.startRom) { this.nes.start() }
    this.nes.ui.enable();
  },
};


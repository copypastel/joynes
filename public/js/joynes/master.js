joynes.Master.prototype = {
  // Should send something like "you already have latest"
  // if nes isn't running.
  sendImageData: function(){
    // var data = this.nes.ui.screen[0].toDataURL();
    var data = document.getElementsByTagName("canvas")[0].toDataURL();
    console.log("Sending: " + data);
    this.socket.send(data);
  },
  setFrameRate: function(rate){
    this.nes.setFramerate(rate);
  }
}

$.extend(joynes.Master.prototype, joynes.Base.prototype);

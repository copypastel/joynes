joynes = {
  Base : {},

  Master : function(nes, socket) {
    this.initialize(nes, socket);
    return this;
  },

  Slave : function(socket) {
    this.initialize(socket);
    return this;
  }
};

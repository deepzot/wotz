function GameModule() {
  this.id = 'gameModule';
  this.label = 'Play';
}

GameModule.prototype.start = function(data) {
  log('game start',data.current);
}

GameModule.prototype.update = function(data) {
  log('game update',data.current);
}

GameModule.prototype.tick = function() { }

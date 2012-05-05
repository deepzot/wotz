function PlayModule() {
  this.id = 'play';
  this.label = 'Play';
}

PlayModule.prototype.start = function(data) {
  log('play start',data.current);
}

PlayModule.prototype.update = function(container) {
  log('play update');
  container.empty();
  container.text('playing...');
}

PlayModule.prototype.end = function() { }

PlayModule.prototype.tick = function() { }

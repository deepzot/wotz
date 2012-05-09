function PlayModule() {
  this.id = 'play';
  this.label = 'Play';
  this.game = new Asteroids();
}

PlayModule.prototype.start = function(data) {
  log('play start',data.current);
  this.game.start(data);
}

PlayModule.prototype.update = function(container) {
  log('play update');
  container.empty();
  this.game.update(container);
}

PlayModule.prototype.end = function() {
	this.game.end();
}

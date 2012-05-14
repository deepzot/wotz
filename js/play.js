function PlayModule() {
  this.id = 'play';
  this.label = 'Play';
  this.game = null;
  this.tetrisActive = true;
  this.game = new Tetris();}

PlayModule.prototype.start = function(data) {
  log('play start',data.current);
  this.game.start(data);
  // Add a hide/show text UI element in the footer.
  var footer = $('#demo div[data-role="footer"]');
  footer.append('<a id="gameSelector" href="#" data-role="button" data-mini="true">Asteroids</a>')
    .trigger('create');
	if(this.tetrisActive) {
    $('#gameSelector .ui-btn-text').text('Asteroids');
	}
	else {
    $('#gameSelector .ui-btn-text').text('Tetris');
	}
  var self = this;
  $('#gameSelector').click(function() {
    self.game.end();
    if(self.tetrisActive) {
      self.tetrisActive = false;
      $('#gameSelector .ui-btn-text').text('Tetris');
      self.game = new Asteroids();
    }
    else {
      self.tetrisActive = true;
      $('#gameSelector .ui-btn-text').text('Asteroids');
      self.game = new Tetris();
    }
	  self.game.start(data);
	  self.game.update(self.container);
    return false;
  });
}

PlayModule.prototype.update = function(container) {
  log('play update');
  container.empty();
  this.container = container;
  this.game.update(this.container);
}

PlayModule.prototype.end = function() {
	this.game.end();
  // Clean up the footer.
  $('#gameSelector').remove();
}

function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
}

ChallengeModule.prototype.start = function(data) {
  log('challenge start',data.current);
}

ChallengeModule.prototype.update = function(data,container) {
  log('challenge update',data.current);
  container.empty();
  container.text('take a challenge...');
}

ChallengeModule.prototype.end = function() { }

ChallengeModule.prototype.tick = function() { }

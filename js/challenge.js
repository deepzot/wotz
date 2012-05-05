function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
}

ChallengeModule.prototype.start = function(data) {
  log('challenge start',data.current);
}

ChallengeModule.prototype.update = function(container) {
  log('challenge update');
  container.empty();
  container.text('take a challenge...');
}

ChallengeModule.prototype.end = function() { }

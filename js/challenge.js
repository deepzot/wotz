function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
}

ChallengeModule.prototype.start = function(data) {
  log('game start',data.current);
}

ChallengeModule.prototype.update = function(data,container) {
log('challenge update',data.current);
}

ChallengeModule.prototype.end = function() { }

ChallengeModule.prototype.tick = function() { }

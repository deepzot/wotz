function ExploreModule() {
  this.id = 'explore';
  this.label = 'Explore';
}

ExploreModule.prototype.start = function(data) {
  log('explore start',data.current);
}

ExploreModule.prototype.update = function(data) {
  log('explore update',data.current);
}

ExploreModule.prototype.end = function() { }

ExploreModule.prototype.tick = function() { }

function ExploreModule() {
  this.id = 'exploreModule';
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

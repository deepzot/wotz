function Splash() {
  this.label = 'Splash';
}

Splash.prototype.start = function(data,settings) { }

Splash.prototype.end = function() { }

Splash.prototype.update = function(container) {
  this.graphics = new Graphics(container,'splashGraph');
  this.graphics.graph.append('svg:rect')
    .attr('fill','white')
    .attr('width',this.graphics.width)
    .attr('height',this.graphics.height);
  this.graphics.showMessage(['wotz a kiloWatt?','let your data','do the talking...'],true);
}

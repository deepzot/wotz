function Splash() {
  this.label = 'Splash';
}

Splash.prototype.start = function(data,settings) { }

Splash.prototype.end = function() { }

Splash.prototype.update = function(container) {
  var graphics = new Graphics(container,'splashGraph');
  graphics.graph.append('svg:rect')
    .attr('fill','white')
    .attr('width',graphics.width)
    .attr('height',graphics.height);
  
  var group = graphics.graph.append('svg:g')
    .attr('id','splash')
    .attr('font-size','50');

  var line1 = group.append('svg:text')
    .attr('x',graphics.width/2)
    .attr('y',graphics.height/2-85)
    .attr('opacity',0);
  line1.selectAll('tspan')
    .data(['wot','z',' a kilowatt?'])
    .enter().append('svg:tspan')
      .text(function(d) { return d; })
      .attr('id',function(d) { return d=='z' ? 'goldz':null; });

  var lines23 = group.append('svg:g')
    .attr('opacity',0);
  lines23.append('svg:text')
    .text('let your data')
    .attr('x',graphics.width/2)
    .attr('y',graphics.height/2+10);
  lines23.append('svg:text')
    .text('do the talking...')
    .attr('x',graphics.width/2)
    .attr('y',graphics.height/2+85);
  
  var scale = graphics.centerVertically(group,0.8*graphics.width,0.8*graphics.height);
  
  line1.transition()
    .delay(0) // ms
    .duration(750) // ms
    .attr('opacity',1);
  
  lines23.transition()
    .delay(500) // ms
    .duration(750) // ms
    .attr('opacity',1);
  
  line1.select('#goldz')
    .attr('fill','#4BB54E')
    .transition()
    .delay(1500) // ms
    .duration(500) // ms
    .attr('fill','#FFDE6C');
}

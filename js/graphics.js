// Creates a new SVG graphics element that fills the specified container.
// The new SVG element will have class 'graphics' and the specified id name.
// Any previous contents of the container will be discarded.
function Graphics(container,name) {
  this.container = $(container);
  // Draw a graph of these readings.
  this.container.empty();
  this.graph = d3.select(this.container.get(0)).append("svg:svg")
    .attr('class','graphics')
    .attr('id', name);
  // Fill our container.
  this.width = this.container.width();
  this.height = this.container.height();
  this.graph.attr('width',this.width).attr('height',this.height);
  // Create an empty SVG definitions section.
  this.defs = this.graph.append('svg:defs');
}

Graphics.prototype.addLinearGradient = function(name,units,vector,stops) {
  var gradient = this.defs.append('svg:linearGradient')
    .attr('id',name)
    .attr('gradientUnits',units)
    .attr('x1',vector[0]).attr('y1',vector[1])
    .attr('x2',vector[2]).attr('y2',vector[3]);
  for(var index = 0; index < stops.length; ++index) {
    var stop = stops[index];
    gradient.append('svg:stop')
      .attr('offset',stop[0])
      .attr('style','stop-color:'+stop[1]+';stop-opacity:'+stop[2]);
  }
  return gradient;
}

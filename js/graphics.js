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

// Creates a new gradient in our definitions section. The type should
// be 'linear' or 'radial'. For a linear gradient you should normally
// provide the following attributes: units,x1,y1,x2,y2. For a radial
// gradient you should normally provide: units,cx,cy,r. The units should
// be either 'userSpaceOnUse' or 'objectBoundingBox'.
Graphics.prototype.addGradient = function(type,attrs,stops) {
  var gradient = this.defs.append('svg:'+type+'Gradient');
  for(var key in attrs) {
    gradient.attr(key,attrs[key]);
  }
  for(var index = 0; index < stops.length; ++index) {
    var stop = stops[index];
    gradient.append('svg:stop')
      .attr('offset',stop[0])
      .attr('style','stop-color:'+stop[1]+';stop-opacity:'+stop[2]);
  }
  return gradient;
}

// Creates a new SVG graphics element that fills the specified container.
// The new SVG element will have class 'graphics' and the specified id name.
// Any previous contents of the container will be discarded.
function Graphics(container,name) {
  // Remember our container in case we need to redraw under our own control.
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

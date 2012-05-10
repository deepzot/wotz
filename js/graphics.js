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
  // Fetch and save the nominal font size in this element.
  this.fontSize = this.container.css('font-size');
  if(this.fontSize.slice(-2) == 'px') {
    this.fontSize = parseFloat(this.fontSize);
  }
  else {
    this.fontSize = 16;
  }  
  // Create an empty SVG definitions section.
  this.defs = this.graph.append('svg:defs');
  // The message group will be created, as needed, when showMessage is
  // first called. We cannot create it here, or it will appear below
  // any subsequent content added to this SVG element.
  this.messageGroup = null;
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

// Displays the specified lines in an SVG group above whatever content has
// already been drawn when this method is first called. Text will be scaled
// to fit our container. If fade is true then the new text will fade in.
// The optional ymin and ymax parameters specify the vertical bounds that
// the text should fit inside, and default to 0 and this.height-1.
Graphics.prototype.showMessage = function(lines,fade,ymin,ymax) {
  fade = typeof fade !== 'undefined' ? fade : false;
  ymin = typeof ymin !== 'undefined' ? ymin : 0;
  ymax = typeof ymax !== 'undefined' ? ymax : this.height-1;
  // Create our message group now, if necessary.
  if(null == this.messageGroup) {
    this.messageGroup = this.graph.append('svg:g').attr('class','messageGroup');
  }
  // Remove any active transform and make the message group invisible.
  this.messageGroup.attr('transform',null).attr('opacity',0);
  // Remove any text already in the group.
  this.messageGroup.selectAll('text').remove();
  // Add each line as a new text element via a d3 data bind. Text is
  // initially assigned a font-size of 10px.
  var center = (lines.length-1)/2;
  this.messageGroup.selectAll('text').data(lines)
    .enter().append('svg:text')
      .text(function(d) { return d; })
      .attr('font-size','10px')
      .attr('y',function(d,i) { return 15*i; }); // line spacing is 15/10=1.5
  // Calculate the bounding box of our (invisible) message group.
  var bbox = this.messageGroup[0][0].getBBox();
  // Calculate the target width and height (only one will actually be reached).
  // Factors of 0.95 below give a bit of extra padding. Fixed sizes of 600,400
  // ensure that messages don't get too large on a large display.
  var targetWidth = Math.min(600,0.95*this.width);
  var targetHeight = Math.min(100*lines.length,0.95*(ymax-ymin));
  // Calculate the maximum scale factor that will still fit, both horizontally
  // and vertically.
  var scaleFactor = Math.min(targetWidth/bbox.width,targetHeight/bbox.height);
  // Calculate the offsets that would center the message on (0,0) before scaling.
  var dx0 = -(bbox.x + bbox.width/2);
  var dy0 = -(bbox.y + bbox.height/2);
  // Calculate the offsets to apply after scaling.
  var dx = dx0 + this.width/(2*scaleFactor);
  var dy = dy0 + (ymax-ymin)/(2*scaleFactor);
  // Apply the scale and translation transforms.
  this.messageGroup
    .attr('transform','scale('+scaleFactor+') translate('+dx+','+dy+')')
    .attr('stroke-width',(2/scaleFactor)+'px');
  // Make the new message group visible.
  if(fade) {
    this.messageGroup
      .transition()
        .duration(750) // ms
        .attr('opacity',1);
  }
  else {
    this.messageGroup
      .attr('opacity',1);
  }
  // Return a reference to the message group.
  return this.messageGroup;
}

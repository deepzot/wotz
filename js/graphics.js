// Creates a new SVG graphics element that fills the specified container.
// The new SVG element will have class 'graphics' and the specified id name.
// Any previous contents of the container will be discarded.
function Graphics(container,name) {
  this.container = $(container);
  // Draw a graph of these readings.
  this.container.empty();
  this.name = name;
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
  // Initialize our message and callout groups. We do not add them to the document
  // now since their ordering determines their layer visibility.
  this.messageGroup = null;
  this.calloutGroup = null;
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

Graphics.prototype.setMessageOpacity = function(opacity,fade) {
  if(null == this.messageGroup) return;
  fade = typeof fade !== 'undefined' ? fade : false;
  if(fade) {
    this.messageGroup
      .transition()
        .duration(750) //ms
        .attr('opacity',opacity);
  }
  else {
    this.messageGroup
      .attr('opacity',opacity);
  }
}

// Creates a placeholder SVG group for displaying messages via showMessage
// that display above all exisiting contents. Any existing group is
// deleted and replaced.
Graphics.prototype.createMessageGroup = function() {
  if(this.messageGroup) $('#messageGroup').remove();
  this.messageGroup = this.graph.append('svg:g').attr('id','messageGroup');
}

// Displays the specified lines in an SVG group above whatever content has
// already been drawn when this method is first called. Text will be scaled
// to fit our container. If fade is true then the new text will fade in.
// The optional ymin and ymax parameters specify the vertical bounds that
// the text should fit inside, and default to 0 and this.height-1.
Graphics.prototype.showMessage = function(lines,fade,ymin,ymax) {
  ymin = typeof ymin !== 'undefined' ? ymin : 0;
  ymax = typeof ymax !== 'undefined' ? ymax : this.height-1;
  // Create our message group now, if necessary.
  if(null == this.messageGroup) this.createMessageGroup();
  // Remove any active transform and make the message group invisible.
  this.messageGroup.attr('transform',null);
  this.setMessageOpacity(0,false);
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
  this.setMessageOpacity(1,fade);
  // Return a reference to the message group.
  return this.messageGroup;
}

// Creates a placeholder SVG group for displaying messages via showMessage
// that display above all exisiting contents. Any existing group is
// deleted and replaced.
Graphics.prototype.createCalloutGroup = function() {
  if(this.calloutGroup) $('#calloutGroup').remove();
  this.calloutGroup = this.graph.append('svg:g').attr('id','calloutGroup');
}

// Clears any callouts.
Graphics.prototype.clearCallouts = function() {
  if(this.calloutGroup) $('#calloutGroup').empty();
}

// Adds a new callout to the document with the specified origin (in SVG coords).
// Clicking the callout will open the specified URL in a new tab or window.
// The optional scale parameter specifies the callout height as a fraction of the total
// SVG element height (default is 0.2)
Graphics.prototype.addCallout = function(x,y,url,scale) {
  scale = typeof scale !== 'undefined' ? scale : 0.2;
  // Create our callout group now, if necessary.
  if(null == this.calloutGroup) this.createCalloutGroup();
  // Calculate scale factor. Intrinsic bounding box of the path below is:
  // x = -11.9, y =-69.4, width = 92.5, height = 69.5
  var cx = -11.9, cy = -69.4;
  var cWidth = 92.5, cHeight = 69.5;
  var absScale = scale*(this.height/cHeight);
  cWidth *= absScale;
  cHeight *= absScale;
  cx = cx*absScale + x;
  cy = cy*absScale + y;
  // Apply any x,y flips necessary to keep most of the callout visible. We also prefer to
  // have callouts point towards the center of the screen, when there is space, to
  // minimize overlap with any centered message being displayed.
  var absXScale = absScale, absYScale = absScale;
  if(cx+cWidth >= this.width || (cx < this.width/2 && cx-cWidth >= 0)) {
    absXScale = -absXScale;
  }
  if(cy < 0 || (cy + this.height/2 && cy+cHeight < this.height)) {
    absYScale = -absYScale;
  }
  // Add the callout path now with the necessary transforms applied and click handler.
  var callout = this.calloutGroup.append('svg:path')
    .attr('d','M-0.069,0.125c0,0,13.052-5.214,13.207-23.169c0,0-8.388,4.919-13.205-3.772\
c0,0-13.933,0.325-11.561-13.55C-9.646-51.955,1.325-53.894,1.325-53.894s2.981-8.231,11.481\
-5.981c0,0,16.944-22.375,43.435,1.4c0,0,12.315-3.275,16.829,9.639c0,0,6.861,0.461,7.486,\
8.336s-7.514,9.764-7.514,9.764s-11.361,14.149-26.897,6.068c0,0-5.442,7.543-15.891,3.078\
C30.255-21.59,23.556-3.375-0.069,0.125z')
    .attr('transform','scale('+absXScale+','+absYScale+') translate('+(x/absXScale)+','+(y/absYScale)+')');
  if(url) {
    callout
      .style('stroke-width',0.025*cHeight)
      .on('click',function() { window.open(url,'_blank'); });
  }
  else {
    callout
      .style('stroke','none')
      .style('cursor','default');
  }
}

function Splash() {
  this.label = 'Splash';
}

Splash.prototype.start = function(data,settings) {
  this.firstTime = true;
}

Splash.prototype.end = function() { }

Splash.prototype.update = function(container) {
  var graphics = new Graphics(container,'splashGraph');
  this.graphics = graphics; // for easier console debugging
    
  // Define some gradients for keynote 'showroom' style background
  graphics.addGradient('linear',
    { id:'splashLinear',gradientUnits:'userSpaceOnUse',x1:'0%',y1:'0%',x2:'0%',y2:'100%' },
    [
      [  '0%','#abb8bf',1.0],
      [ '55%','#abb8bf',1.0],
      [ '75%','#e2e6eb',1.0],
      ['100%','#e2e6eb',1.0]
    ]);
  graphics.addGradient('radial',
    { id:'splashRadial',gradientUnits:'userSpaceOnUse',cx:'50%',cy:'0%',r:'65%' },
    [
      [  '0%','#e6edf0',1.0],
      ['100%','#e6edf0',0.0]
    ]);
  graphics.graph.append('svg:rect')
    .attr('fill','url(#splashLinear)')
    .attr('width',graphics.width)
    .attr('height',graphics.height);
  graphics.graph.append('svg:rect')
    .attr('fill','url(#splashRadial)')
    .attr('width',graphics.width)
    .attr('height',graphics.height);

  // Add some text to draw attention to the module buttons in the header toolbar.
  var ptrs = graphics.graph.selectAll('text.splashPointer')
    .data([0.167,0.5,0.833])
    .enter().append('svg:text')
      .attr('class','splashPointer')
      .attr('opacity',0)
      .text('☝')
      .attr('x',function(d) { return d*graphics.width; })
      .attr('y',3*graphics.fontSize);
  if(this.firstTime) {
    ptrs.transition()
      .delay(function(d,i) { return 2000+250*i; }) // in ms
      .attr('opacity',1);
  }
  else {
    ptrs.attr('opacity',1);
  }
  
  var group = graphics.graph.append('svg:g')
    .attr('id','splash')
    .attr('font-size','50');

  var line1 = group.append('svg:text')
    .attr('x',graphics.width/2)
    .attr('y',graphics.height/2-80)
    .attr('fill','#4BB54E')
    .attr('opacity',0);
  line1.selectAll('tspan')
    .data(['wot','z',' a kilowatt?'])
    .enter().append('svg:tspan')
      .text(function(d) { return d; })
      .attr('id',function(d) { return d=='z' ? 'goldz':null; });

  var lines23 = group.append('svg:g')
    .attr('fill','#4A4439')
    .attr('opacity',0);
  lines23.append('svg:text')
    .text('let your data')
    .attr('x',graphics.width/2)
    .attr('y',graphics.height/2+5);
  lines23.append('svg:text')
    .text('do the talking...')
    .attr('x',graphics.width/2)
    .attr('y',graphics.height/2+80);
  
  var scale = graphics.centerVertically(group,0.8*graphics.width,0.8*graphics.height);
  if(isNaN(scale)) {
    log('splash found empty bbox');
    return;
  }

  var line2box = $('#splash text')[1].getBBox();
  var scall = 0.75*scale*line2box.height/graphics.height;
  var xcall = graphics.width/2 + scale*line2box.width/2;
  var ycall = graphics.height/2;
  graphics.addCallout(xcall,ycall,{ scale:scall, xauto:false, yauto:false })
  graphics.calloutGroup.attr('opacity',0);
  
  if(this.firstTime) {
    line1.transition()
      .delay(0) // ms
      .duration(750) // ms
      .attr('opacity',1);
  
    lines23.transition()
      .delay(500) // ms
      .duration(750) // ms
      .attr('opacity',1);
      
    graphics.calloutGroup.transition()
      .delay(600) // ms
      .duration(750) // ms
      .attr('opacity',1);
  
    line1.select('#goldz')
      .attr('fill','#4BB54E')
      .transition()
      .delay(1500) // ms
      .duration(250) // ms
      .attr('fill','#FFDE6C');
      
      this.firstTime = false;
    }
    else {
      line1.select('#goldz')
        .attr('fill','#FFDE6C');
      line1.attr('opacity',1);
      lines23.attr('opacity',1);
      graphics.calloutGroup.attr('opacity',1);
    }
}

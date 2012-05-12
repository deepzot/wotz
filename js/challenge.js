function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
  this.dataSource = null;
  this.hourlyData = new Array(12);
  this.timer = null;
}

ChallengeModule.prototype.start = function(data) {
  log('challenge start at',data.getDateTime());
  // Remember our data source.
  this.dataSource = data;
  this.maxHourly = 0;
  var now = new Date();
  var hour = now.getHours();
  for(var offset = 0; offset < 12; ++offset) {
    var value = this.dataSource.averageByHour((hour + offset)%24);
    this.hourlyData[offset] = value;
    if(value > this.maxHourly) this.maxHourly = value;
  }
  this.hourOrigin = hour % 12;
}

ChallengeModule.prototype.update = function(container) {
  var self = this;
  // Create a new SVG graphics element that fills our container.
  var graphics = new Graphics(container,'challengeGraph');
  this.graphics = graphics;
  // Draw a clock face.
  var radius = 0.4*Math.min(graphics.height,graphics.width);
  graphics.graph.append('svg:circle')
    .attr('id','clockCircle')
    .attr('cx',graphics.width/2)
    .attr('cy',graphics.height/2)
    .attr('r',radius/2);
  graphics.graph.selectAll('text.clockLabel')
    .data([12,3,6,9])
    .enter().append('svg:text')
      .attr('class','clockLabel')
      .text(function(d) { return d; })
      .attr('x',graphics.width/2)
      .attr('y',graphics.height/2)
      .attr('transform',function(d) {
        return 'rotate('+(30*d)+','+graphics.width/2+','+graphics.height/2+') translate(0,'+(-radius/2+2*graphics.fontSize)+')';
      });
  // Start real-time clock hands going.
  graphics.graph.selectAll('line.clockHand')
    .data([0,0,0])
    .enter().append('svg:line')
      .attr('class','clockHand')
      .attr('opacity',0)
      .attr('id',function(d,i) { return 'clockHand'+i; })
      .attr('x1',graphics.width/2)
      .attr('y1',graphics.height/2+graphics.height/50)
      .attr('x2',graphics.width/2)
      .attr('y2',function(d,i) { return graphics.height/2 - ((i==0)? 0.35*radius : 0.45*radius); });
  if(this.timer) clearInterval(this.timer);
  this.timer = setInterval(function() {
    var now = new Date();
    // Only hour hand moves continuously.
    var mins = now.getMinutes();
    var hands = [ (now.getHours()%12 + mins/60)/12, mins/60, now.getSeconds()/60 ];
    graphics.graph.selectAll('line.clockHand').data(hands)
      .attr('opacity',1)
      .attr('transform',function(d) { return 'rotate('+360*d+','+graphics.width/2+','+graphics.height/2+')'});
  },1000);
  // Draw average hourly usage around the clock face.
  var gap = graphics.fontSize/2;
  var hourlyArc = d3.svg.arc()
    .innerRadius(radius/2+graphics.fontSize/2)
    .outerRadius(function(d) { return radius/2+gap + (radius/2-gap)*d/self.maxHourly; })
    .startAngle(function(d,i) { return (i+self.hourOrigin)*Math.PI/6; })
    .endAngle(function(d,i) { return (i+1+self.hourOrigin)*Math.PI/6; });
  var hourlyDataG = graphics.graph.append('svg:g');
  hourlyDataG.selectAll('path.hourlyArc')
    .data(this.hourlyData)
    .enter()
    .append('svg:path')
      .attr('class','hourlyArc')
      .attr('opacity',function(d,i) { return 1-i/12; })
      .attr('d',hourlyArc);
  hourlyDataG.attr('transform','translate('+graphics.width/2+','+graphics.height/2+')');
}

ChallengeModule.prototype.end = function() { }

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
    log('avg',hour,offset,value);
    this.hourlyData[offset] = value;
    if(value > this.maxHourly) this.maxHourly = value;
  }
  this.hourOrigin = hour % 12;
}

ChallengeModule.prototype.update = function(container) {
  var self = this;
  // Remember our container in case we need to redraw under our own control.
  this.container = container;
  // Initialize SVG
  container.empty();
  var graph = d3.select('#moduleContent').append("svg:svg")
    .attr('class','graphics')
    .attr('id', 'challengeGraph');
  var width = $('#moduleContent').width(), height = $('#moduleContent').height();
  graph.attr('width',width).attr('height',height);
  // Calculate a nominal scaling unit for labels.
  var emUnit = $('#challengeGraph').css('font-size');
  if(emUnit.slice(-2) == 'px') {
    emUnit = parseFloat(emUnit);
  }
  else {
    emUnit = 10;
  }
  // Draw a clock face.
  var radius = 0.4*Math.min(height,width);
  graph.append('svg:circle')
    .attr('id','clockCircle')
    .attr('cx',width/2)
    .attr('cy',height/2)
    .attr('r',radius/2);
  graph.selectAll('text.clockLabel')
    .data([12,3,6,9])
    .enter().append('svg:text')
      .attr('class','clockLabel')
      .text(function(d) { return d; })
      .attr('x',width/2)
      .attr('y',height/2)
      .attr('transform',function(d) {
        return 'rotate('+(30*d)+','+width/2+','+height/2+') translate(0,'+(-radius/2+2*emUnit)+')';
      });
  // Start real-time clock hands going.
  graph.selectAll('line.clockHand')
    .data([0,0,0])
    .enter().append('svg:line')
      .attr('class','clockHand')
      .attr('opacity',0)
      .attr('id',function(d,i) { return 'clockHand'+i; })
      .attr('x1',width/2)
      .attr('y1',height/2+height/50)
      .attr('x2',width/2)
      .attr('y2',function(d,i) { return height/2 - ((i==0)? 0.35*radius : 0.45*radius); });
  if(this.timer) clearInterval(this.timer);
  this.timer = setInterval(function() {
    var now = new Date();
    // Only hour hand moves continuously.
    var mins = now.getMinutes();
    var hands = [ (now.getHours()%12 + mins/60)/12, mins/60, now.getSeconds()/60 ];
    graph.selectAll('line.clockHand').data(hands)
      .attr('opacity',1)
      .attr('transform',function(d) { return 'rotate('+360*d+','+width/2+','+height/2+')'});
  },1000);
  // Draw average hourly usage around the clock face.
  var gap = emUnit/2;
  var hourlyArc = d3.svg.arc()
    .innerRadius(radius/2+emUnit/2)
    .outerRadius(function(d) { return radius/2+gap + (radius/2-gap)*d/self.maxHourly; })
    .startAngle(function(d,i) { return (i+self.hourOrigin)*Math.PI/6; })
    .endAngle(function(d,i) { return (i+1+self.hourOrigin)*Math.PI/6; });
  var hourlyDataG = graph.append('svg:g');
  hourlyDataG.selectAll('path.hourlyArc')
    .data(this.hourlyData)
    .enter()
    .append('svg:path')
      .attr('class','hourlyArc')
      .attr('opacity',function(d,i) { return 1-i/12; })
      .attr('d',hourlyArc);
  hourlyDataG.attr('transform','translate('+width/2+','+height/2+')');
}

ChallengeModule.prototype.end = function() { }

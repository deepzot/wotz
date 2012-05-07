function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
  this.dataSource = null;
  this.hourlyData = new Array(24);
}

ChallengeModule.prototype.start = function(data) {
  log('challenge start at',data.getDateTime());
  // Remember our data source.
  this.dataSource = data;
  this.maxHourly = 0;
  for(var hr = 0; hr < 24; ++hr) {
    var value = this.dataSource.averageByHour(hr);
    this.hourlyData[hr] = value;
    if(value > this.maxHourly) this.maxHourly = value;
  }
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
  var rotation = d3.scale.linear()
    .domain([0,12])
    .range([0,360]);
  var radius = 0.4*Math.min(height,width);
  graph.append('svg:circle')
    .attr('id','innerCircle')
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
        return 'rotate('+rotation(d)+','+width/2+','+height/2+') translate(0,'+(-radius/2+2*emUnit)+')';
      });
  // Draw real-time clock hands.
  graph.selectAll('line.clockHand')
    .data([0.6,0.75,0.2])
    .enter().append('svg:line')
      .attr('class','clockHand')
      .attr('x1',width/2)
      .attr('y1',height/2+height/50)
      .attr('x2',width/2)
      .attr('y2',function(d,i) { return height/2 - ((i==0)? 0.35*radius : 0.45*radius); })
      .attr('stroke-width', function(d,i) { return 0.4*emUnit/(i+1); })
      .attr('transform',function(d) { return 'rotate('+360*d+','+width/2+','+height/2+')'});
  // Draw average hourly usage around the clock face.
  var hourlyArc = d3.svg.arc()
    .innerRadius(radius/2)
    .outerRadius(function(d) { return radius/2*(1+d/self.maxHourly); })
    .startAngle(function(d,i) { return rotation(i)*Math.PI/180; })
    .endAngle(function(d,i) { return rotation(i+1)*Math.PI/180; });
  var hourlyData = graph.append('svg:g');
  hourlyData.selectAll('path.hourlyArc')
    .data(this.hourlyData.slice(12,24))
    .enter()
    .append('svg:path')
      .attr('class','hourlyArc')
      .attr('d',hourlyArc);
  hourlyData.attr('transform','translate('+width/2+','+height/2+')');
}

ChallengeModule.prototype.end = function() { }

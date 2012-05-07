function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
  this.dataSource = null;
}

ChallengeModule.prototype.start = function(data) {
  log('challenge start at',data.getDateTime());
  // Remember our data source.
  this.dataSource = data;
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
}

ChallengeModule.prototype.end = function() { }

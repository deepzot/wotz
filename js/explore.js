function ExploreModule() {
  this.id = 'explore';
  this.label = 'Explore';
  this.dataSource = null;
  this.displayData = null;
  this.displayRange = [ null,null ];
}

ExploreModule.prototype.start = function(data) {
  log('explore start at',data.getDateTime());
  // Remember our data source.
  this.dataSource = data;
  // Grab the most recent 2 complete days of data.
  this.dayOffset = 0;
  this.landHeight = null;
  this.getData();
  // Reset messaging.
  this.messageCount = 0;
  this.currentMessage = ['Welcome to your','energy-use landscape.','Touch to continue...'];
}

ExploreModule.prototype.update = function(container) {
  var self = this;
  // Remember our container in case we need to redraw under our own control.
  this.container = container;
  // Draw a graph of these readings.
  container.empty();
  var graph = d3.select('#moduleContent').append("svg:svg")
    .attr('class','graphics')
    .attr('id', 'exploreGraph');
  var width = $('#moduleContent').width(), height = $('#moduleContent').height();
  graph.attr('width',width).attr('height',height);
  // Initialize SVG definitions.
  var defs = graph.append('svg:defs');
  defs.append('svg:linearGradient')
    .attr('id', 'skyGradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1','0%').attr('y1','0%')
    .attr('x2','100%').attr('y2','0%')
    .call(function(gradient) {
      gradient.append('svg:stop').attr('offset', '5%')
        .attr('style', 'stop-color:rgb(180,150,150);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '20%')
        .attr('style', 'stop-color:rgb(180,180,255);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '30%')
        .attr('style', 'stop-color:rgb(180,180,255);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '45%')
        .attr('style', 'stop-color:rgb(180,150,150);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '55%')
        .attr('style', 'stop-color:rgb(180,150,150);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '70%')
        .attr('style', 'stop-color:rgb(180,180,255);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '80%')
        .attr('style', 'stop-color:rgb(180,180,255);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '95%')
        .attr('style', 'stop-color:rgb(180,150,150);stop-opacity:1');
    });
  defs.append('svg:radialGradient')
    .attr('id','sunGradient')
    .attr('gradientUnits','objectBoundingBox')
    .attr('cx','50%').attr('cy','0%')
    .attr('r','25%')
    .call(function(gradient) {
      gradient.append('svg:stop').attr('offset', '0%')
        .attr('style', 'stop-color:rgb(255,245,140);stop-opacity:0.75');
      gradient.append('svg:stop').attr('offset', '100%')
        .attr('style', 'stop-color:rgb(255,245,140);stop-opacity:0');
    });
  defs.append('svg:linearGradient')
    .attr('id','seaGradient')
    .attr('gradientUnits', 'objectBoundingBox')
    .attr('x1','0%').attr('y1','0%')
    .attr('x2','0%').attr('y2','100%')
    .call(function(gradient) {
      gradient.append('svg:stop').attr('offset', '0%')
        .attr('style', 'stop-color:rgb(75,120,100);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '15%')
        .attr('style', 'stop-color:rgb(50,100,100);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '100%')
        .attr('style', 'stop-color:rgb(28,0,100);stop-opacity:1');
    });
  defs.append('svg:linearGradient')
    .attr('id','hillGradient')
    .attr('gradientUnits', 'objectBoundingBox')
    .attr('x1','0%').attr('y1','100%')
    .attr('x2','0%').attr('y2','0%')
    .call(function(gradient) {
      gradient.append('svg:stop').attr('offset', '0%')
        .attr('style', 'stop-color:rgb(233,240,161);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '20%')
        .attr('style', 'stop-color:rgb(83,156,50);stop-opacity:1');
      gradient.append('svg:stop').attr('offset', '100%')
        .attr('style', 'stop-color:rgb(97,102,107);stop-opacity:1');
    });

  // Prepare axis scaling functions.
  var x = d3.scale.linear()
    .domain([0,48])
    .range([0,width-1]);
  var y = d3.scale.linear()
    .domain([0,self.dataSource.maxValue])
    .range([height-1,0]);
  // Draw the background sky.
  graph.append('svg:rect')
    .attr('fill','url(#skyGradient)')
    .attr('x',0)
    .attr('y',0)
    .attr('width',width)
    .attr('height',height);
  graph.append('svg:rect')
    .attr('fill','url(#sunGradient)')
    .attr('x',0)
    .attr('y',0)
    .attr('width',width/2)
    .attr('height',height);
  graph.append('svg:rect')
    .attr('fill','url(#sunGradient)')
    .attr('x',width/2)
    .attr('y',0)
    .attr('width',width/2)
    .attr('height',height);
  // Draw land heights.
  var land = d3.svg.area()
    .x(function(d,i) { return x((i-0.5)/self.dataSource.readingsPerHour); })
    .y0(y(this.minValue))
    .y1(function(d,i) { return y(d); })
    .interpolate('linear');
  var hills = d3.svg.area()
    .x(function(d,i) { return x(i-0.5); })
    .y0(land.y0())
    .y1(land.y1())
    .interpolate('basis');
  graph.append('svg:path')
    .attr('class','land1')
    .attr('d',land(this.landHeight));
  graph.append('svg:path')
    .attr('class','land2')
    .attr('d',land(this.landHeight2));
  graph.append('svg:path')
    .attr('fill','url(#hillGradient)')
    .attr('d',hills(this.landHeight3));
  // Draw a base-load sea level.
  var sea = d3.svg.area()
    .x(function(d,i) { return x(6*i); })
    .y1(function(d,i) { return y(self.minValue*(1.05+0.05*Math.sin(Math.PI*i/2))); })
    .y0(height)
    .interpolate('basis');
  var seaData = [0,0,0,0,0,0,0,0,0];
  graph.append('svg:path')
    .attr('fill','url(#seaGradient)')
    .attr('d',sea(seaData));
  // Calculate a nominal scaling unit for labels.
  var emUnit = $('#exploreGraph').css('font-size');
  if(emUnit.slice(-2) == 'px') {
    emUnit = parseFloat(emUnit);
  }
  else {
    emUnit = 10;
  }
  // Add time-of-day labels.
  var labelPos = null;
  var timeLabels = graph.selectAll('text.timeLabel');
  // Use 4 or 7 labels, depending on how much space we have available.
  if(width > 500) {
    timeLabels = timeLabels.data(['6am','noon','6pm','midnight','6am','noon','6pm']);
    labelPos = function(d,i) { return x(6*(i+1)); };
  }
  else {
    timeLabels = timeLabels.data(['6am','6pm','6am','6pm']);
    labelPos = function(d,i) { return x(12*i+6); };
  }
  timeLabels.enter().append('svg:text')
    .attr('class','timeLabel')
    .text(function(d,i) { return d; })
    .attr('x', labelPos)
    .attr('y', height-emUnit);
  // Add day-of-week labels.
  var weekDay = d3.time.format('%a');
  var fullDate = d3.time.format('%m/%d');
  var formatter = null;
  if(this.dayOffset > -6) {
    // Display abbreviated day of the week for the past week.
    formatter = function(d,i) { return weekDay(self.dataSource.getDateTime(d)); };
  }
  else {
    // Display MM/DD for days more than a week ago.
    formatter = function(d,i) { return fullDate(self.dataSource.getDateTime(d)); }
  }
  graph.selectAll('text.dayLabel')
    .data([
      this.displayRange[0] + 12*this.dataSource.readingsPerHour,
      this.displayRange[1] - 12*this.dataSource.readingsPerHour ])
    .enter().append('svg:text')
      .attr('class','dayLabel')
      .text(formatter)
      .attr('x', function(d,i) { return x(24*i+12); })
      .attr('y', height-3*emUnit);
  // Add navigation labels.
  if(this.displayRange[0] >= this.dataSource.readingsPerDay) {
    graph.append('svg:text')
      .attr('class','leftArrow')
      .text('<')
      .attr('x',x(0.5))
      .attr('y', height-3*emUnit)
      .on('click', function() { self.navBack(); });
  }
  if(this.displayRange[1] <= this.dataSource.current - this.dataSource.readingsPerDay) {
    graph.append('svg:text')
      .attr('class','rightArrow')
      .text('>')
      .attr('x',x(47.5))
      .attr('y', height-3*emUnit)
      .on('click', function() { self.navForward(); });
  }
  // Show the current message.
  graph.append('svg:g').attr('id','exploreMessage');
  this.showMessage();
}

ExploreModule.prototype.showMessage = function() {
  var graph = d3.select('#exploreGraph');
  var width = $('#exploreGraph').width(), height = $('#exploreGraph').height();
  var message = d3.select('#exploreMessage').attr('transform',null).attr('opacity',0);
  var msgLength = this.currentMessage.length;
  message.selectAll('text').remove();
  message.selectAll('text').data(this.currentMessage)
    .enter().append('svg:text')
      .text(function(d) { return d; })
      .attr('font-size','10px')
      .attr('x',0)
      .attr('y',function(d,i) { return 15*(i-(msgLength-1)/2); });
  var bbox = $('#exploreMessage')[0].getBBox();
  var scaleFactor = Math.min(0.95*width/bbox.width,0.8*height/bbox.height);
  var dx = width/(2*scaleFactor);
  var dy = height/(2*scaleFactor) - bbox.y/scaleFactor;
  message
    .attr('transform','scale('+scaleFactor+') translate(' + dx + ',' + dy + ')')
    .attr('stroke-width',(2/scaleFactor)+'px');
  // Only animate fade-in if this is the first time this message is being displayed.
  if(this.messageCount != this.lastMessageCount) {
    message.transition()
    .duration(750) // ms
    .attr('opacity',1);
  }
  else {
    message.attr('opacity',1);
  }
  this.lastMessageCount = this.messageCount;
  var self = this;
  message.on('click',function() {
    self.currentMessage = self.getNextMessage();
    self.showMessage();
  });
}

ExploreModule.prototype.getNextMessage = function() {
  this.messageCount++;
  return ['Here is message','number '+this.messageCount];
}

// Fetches and analyzes the data corresponding to this.dayOffset
ExploreModule.prototype.getData = function() {
  // Fetch the data from our source.
  this.displayData = this.dataSource.getDays(this.dayOffset-2,this.dayOffset,this.displayRange);
  // Find the minimum reading.
  var size = this.displayData.length;
  var minValue = this.dataSource.maxValue;
  for(var i = 0; i < size; ++i) {
    var value = this.displayData[i];
    if(value < minValue) minValue = value;
  }
  this.minValue = minValue;
  this.baseLoad = 1.1*minValue;
  // Calculate an array of land heights.
  if(this.landHeight == null) {
    this.landHeight = new Array(size+2);
    this.landHeight2 = new Array(size+2);
    this.landHeight3 = new Array(48+2);
  }
  this.landHeight[0] = this.landHeight[size+1] = minValue;
  this.landHeight2[0] = this.landHeight2[size+1] = minValue;
  for(var i = 0; i < size; ++i) {
    this.landHeight[i+1] = Math.max(this.displayData[i],minValue);
    this.landHeight2[i+1] = (this.landHeight[i+1]-minValue)*(0.75+0.25*Math.random()) + minValue;
  }
  this.landHeight3[0] = this.landHeight3[49] = minValue;
  for(var i = 0; i < 24; ++i) {
    var hourAvg = this.dataSource.averageByHour(i);
    hourAvg = minValue + 0.5*(hourAvg - minValue);
    hourAvg = Math.max(hourAvg,minValue);
    this.landHeight3[i+1] = this.landHeight3[i+25] = hourAvg;
  }
}

// Handles a request to view earlier data.
ExploreModule.prototype.navBack = function() {
  this.dayOffset--;
  this.getData();
  this.update(this.container);
}

// Handles a request to view more recent data.
ExploreModule.prototype.navForward = function() {
  this.dayOffset++;
  this.getData();
  this.update(this.container);
}

ExploreModule.prototype.end = function() {
  this.displayData = null;
}

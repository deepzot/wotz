function ExploreModule() {
  this.id = 'explore';
  this.label = 'Explore';
  this.dataSource = null;
  this.displayData = null;
  this.displayRange = [ null,null ];
  // Reset messaging.
  this.messageCount = 0;
}

ExploreModule.prototype.start = function(data) {
  log('explore start at',data.getDateTime());
  // Remember our data source.
  this.dataSource = data;
  // Grab the most recent 2 complete days of data.
  this.dayOffset = 0;
  this.landHeight = null;
  this.getData();
  // Display the next message.
  this.getNextMessage();
}

ExploreModule.prototype.update = function(container) {
  var self = this;
  // Remember our container in case we need to redraw under our own control.
  this.container = container;
  // Create a new SVG graphics element that fills our container.
  var graphics = new Graphics(container,'exploreGraph');
  // Create a linear sky gradient.
  graphics.addGradient('linear',
    {id:'skyGradient',gradientUnits:'userSpaceOnUse',x1:'0%',y1:'0%',x2:'100%',y2:'0%'},
    [
      [ '5%','rgb(180,180,255)','1'],
      ['20%','rgb(180,180,255)','1'],
      ['30%','rgb(180,180,255)','1'],
      ['45%','rgb(180,150,150)','1'],
      ['55%','rgb(180,150,150)','1'],
      ['70%','rgb(180,180,255)','1'],
      ['80%','rgb(180,180,255)','1'],
      ['95%','rgb(180,150,150)','1']
    ]);
  // Create a radial sun gradient.
  graphics.addGradient('radial',
    {id:'sunGradient',gradientUnits:'objectBoundingBox',cx:'50%',cy:'0%',r:'25%'},
    [
      [  '0%','rgb(255,245,140)','0.75'],
      ['100%','rgb(255,245,140)','0']
    ]);
  // Create a linear sea gradient.
  graphics.addGradient('linear',
    {id:'seaGradient',gradientUnits:'objectBoundingBox',x1:'0%',y1:'0%',x2:'0%',y2:'100%'},
    [
      [  '0%','rgb(75,120,100)','1'],
      [ '15%','rgb(50,100,100)','1'],
      ['100%','rgb(28,0,100)','1']
    ]);
  // Create a linear hill gradient.
  graphics.addGradient('linear',
    {id:'hillGradient',gradientUnits:'objectBoundingBox',x1:'0%',y1:'100%',x2:'0%',y2:'0%'},
    [
      [  '0%','rgb(233,240,161)','1'],
      [ '20%','rgb(83,156,50)','1'],
      ['100%','rgb(97,102,107)','1']
    ]);
  // Prepare axis scaling functions.
  var x = d3.scale.linear()
    .domain([0,48])
    .range([0,graphics.width-1]);
  var y = d3.scale.linear()
    .domain([0,self.dataSource.maxValue])
    .range([graphics.height-1,0]);
  // Draw the background sky.
  graphics.graph.append('svg:rect')
    .attr('fill','url(#skyGradient)')
    .attr('x',0)
    .attr('y',0)
    .attr('width',graphics.width)
    .attr('height',graphics.height);
  graphics.graph.append('svg:rect')
    .attr('fill','url(#sunGradient)')
    .attr('x',0)
    .attr('y',0)
    .attr('width',graphics.width/2)
    .attr('height',graphics.height);
  graphics.graph.append('svg:rect')
    .attr('fill','url(#sunGradient)')
    .attr('x',graphics.width/2)
    .attr('y',0)
    .attr('width',graphics.width/2)
    .attr('height',graphics.height);
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
  graphics.graph.append('svg:path')
    .attr('class','land1')
    .attr('d',land(this.landHeight));
  graphics.graph.append('svg:path')
    .attr('class','land2')
    .attr('d',land(this.landHeight2));
  graphics.graph.append('svg:path')
    .attr('fill','url(#hillGradient)')
    .attr('d',hills(this.landHeight3));
  // Draw a base-load sea level.
  var sea = d3.svg.area()
    .x(function(d,i) { return x(6*i); })
    .y1(function(d,i) { return y(self.minValue*(1.05+0.05*Math.sin(Math.PI*i/2))); })
    .y0(graphics.height)
    .interpolate('basis');
  var seaData = [0,0,0,0,0,0,0,0,0];
  graphics.graph.append('svg:path')
    .attr('fill','url(#seaGradient)')
    .attr('d',sea(seaData));
  // Add time-of-day labels.
  var labelPos = null;
  var timeLabels = graphics.graph.selectAll('text.timeLabel');
  // Use 4 or 7 labels, depending on how much space we have available.
  if(graphics.width > 500) {
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
    .attr('y', graphics.height-graphics.fontSize);
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
  graphics.graph.selectAll('text.dayLabel')
    .data([
      this.displayRange[0] + 12*this.dataSource.readingsPerHour,
      this.displayRange[1] - 12*this.dataSource.readingsPerHour ])
    .enter().append('svg:text')
      .attr('class','dayLabel')
      .text(formatter)
      .attr('x', function(d,i) { return x(24*i+12); })
      .attr('y', graphics.height-3*graphics.fontSize);
  // Add navigation labels.
  if(this.displayRange[0] >= this.dataSource.readingsPerDay) {
    graphics.graph.append('svg:text')
      .attr('class','leftArrow')
      .text('<')
      .attr('x',x(0.5))
      .attr('y', graphics.height-3*graphics.fontSize)
      .on('click', function() { self.navBack(); });
  }
  if(this.displayRange[1] <= this.dataSource.current - this.dataSource.readingsPerDay) {
    graphics.graph.append('svg:text')
      .attr('class','rightArrow')
      .text('>')
      .attr('x',x(47.5))
      .attr('y', graphics.height-3*graphics.fontSize)
      .on('click', function() { self.navForward(); });
  }
  // Show the current message.
  graphics.graph.append('svg:g').attr('id','exploreMessage');
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
  var labelBox = $('.dayLabel')[0].getBBox();
  var scaleFactor = Math.min(0.95*width/bbox.width,0.95*labelBox.y/bbox.height);
  var dx = (width/2)/scaleFactor;
  // Add an extra 5px to vertically center text (original font-size is 10px)
  var dy = (labelBox.y/2 + 5)/scaleFactor;
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
    self.getNextMessage();
    self.showMessage();
  });
}

ExploreModule.prototype.getNextMessage = function() {
  this.messageCount++;
  var newMessage;
  if(this.messageCount == 1) {
    newMessage = ['Welcome to your','energy-use landscape.','Touch to continue...'];
  }
  else {
    newMessage = ['Here is message','number '+this.messageCount];
  }
  this.currentMessage = newMessage;
}

ExploreModule.prototype.getShareText = function() {
  return this.currentMessage.join(' ');
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

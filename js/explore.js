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
  this.getData();
}

ExploreModule.prototype.update = function(container) {
  var self = this;
  log('maxValue',this.dataSource.maxValue);
  // Remember our container in case we need to redraw under our own control.
  this.container = container;
  // Draw a graph of these readings.
  container.empty();
  var graph = d3.select('#moduleContent').append("svg:svg")
    .attr('class','graphics')
    .attr('id', 'exploreGraph');
  var width = $('#exploreGraph').width(), height = $('#exploreGraph').height();
  var x = d3.scale.linear()
    .domain([0,48])
    .range([0,width-1])
  var y = d3.scale.linear()
    .domain([self.dataSource.maxValue,0])
    .range([0,height-1]);
  graph.selectAll("rect")
    .data(this.displayData)
    .enter().append("svg:rect")
      .attr("x", function(d,i) { return x(i) })
      .attr("y", function(d,i) { return y(d) })
      .attr("height", function(d,i) { return height-y(d) })
      .attr("width", function(d,i) { return x(i+1)-x(i); });
  // Calculate a nominal scaling unit for labels.
  var emUnit = $('#exploreGraph').css('font-size');
  if(emUnit.slice(-2) == 'px') {
    emUnit = parseFloat(emUnit);
  }
  else {
    emUnit = 10;
  }
  log('em',emUnit);
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
  var weekDay = d3.time.format("%a");
  var formatter = function(d,i) { return weekDay(self.dataSource.getDateTime(d)); };
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
}

// Fetches and analyzes the data corresponding to this.dayOffset
ExploreModule.prototype.getData = function() {
  this.displayData = this.dataSource.getDays(this.dayOffset-2,this.dayOffset,this.displayRange);   
  log('getData: range is now',this.displayRange)
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

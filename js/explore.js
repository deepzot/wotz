function ExploreModule() {
  this.id = 'explore';
  this.label = 'Explore';
  this.dataSource = null;
  this.displayData = null;
  this.displayRange = [ null,null ];
}

ExploreModule.prototype.start = function(data) {
  log('explore start at',data.getSimulationTime());
  // Remember our data source.
  this.dataSource = data;
  // Grab the most recent 2 complete days of data.
  this.displayData = data.getDays(-2,0,this.displayRange);
  log('range',this.displayRange)
  this.dayOffset = 0;
}

ExploreModule.prototype.update = function(container) {
  // Draw a graph of these readings.
  container.empty();
  var graph = d3.select('#moduleContent').append("svg")
    .attr('class','graphics')
    .attr('id', 'exploreGraph');
  var width = $('#exploreGraph').width(), height = $('#exploreGraph').height();
  var x = d3.scale.linear()
    .domain([0,48])
    .range([0,width-1])
  var y = d3.scale.linear()
    .domain([2000,0])
    .range([0,height-1]);
  graph.selectAll("rect")
    .data(this.displayData)
    .enter().append("rect")
      .attr("x", function(d,i) { return x(i) })
      .attr("y", function(d,i) { return y(d) })
      .attr("height", function(d,i) { return height-y(d) })
      .attr("width", function(d,i) { return x(i+1)-x(i); });
  // Add day-of-week labels
  
}

ExploreModule.prototype.end = function() {
  this.displayData = null;
}

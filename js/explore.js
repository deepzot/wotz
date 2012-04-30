function ExploreModule() {
  this.id = 'explore';
  this.label = 'Explore';
}

ExploreModule.prototype.start = function(data) {
  log('explore start',data.current);
}

ExploreModule.prototype.update = function(data,container) {
  // Grab the most recent 48 readings.
  var recent = data.getRecent(48);
  // Draw a graph of these readings.
  $('#moduleContent').empty();
  var graph = d3.select('#moduleContent').append("svg")
    .attr('class','graphics')
    .attr('id', 'exploreGraph');
  var width = $('#exploreGraph').width(), height = $('#exploreGraph').height();
  var x = d3.scale.linear()
    .domain([recent[0].start.getTime(),recent[recent.length-1].start.getTime()+3600000])
    .range([0,width-1])
  var y = d3.scale.linear()
    .domain([2000,0])
    .range([0,height-1]);
  graph.selectAll("rect")
    .data(recent)
    .enter().append("rect")
      .attr("x", function(d,i) { return x(d.start.getTime()) })
      .attr("y", function(d,i) { return y(d.value) })
      .attr("height", function(d,i) { return height-y(d.value) })
      .attr("width", function(d,i) {
        return x(d.start.getTime()+d.duration*1000)-x(d.start.getTime())
      });
}

ExploreModule.prototype.end = function() { }

ExploreModule.prototype.tick = function() { }

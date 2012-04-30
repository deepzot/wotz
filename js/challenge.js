function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
}

ChallengeModule.prototype.start = function(data) {
  log('game start',data.current);
}

ChallengeModule.prototype.update = function(data) {
  log('game update',data.current);
  // Grab the most recent 48 readings.
  var recent = data.getRecent(48);
  // Draw a graph of these readings.
  $('#moduleContent').empty();
  var graph = d3.select('#moduleContent').append("svg")
    .attr("id", "challengeGraph")
    .attr("width", 600)
    .attr("height", 400);
  var x = d3.scale.linear()
    .domain([recent[0].start.getTime(),recent[recent.length-1].start.getTime()+3600000])
    .range([0,600])
  var y = d3.scale.linear()
    .domain([2000,0])
    .range([0,400]);
  graph.selectAll("rect")
    .data(recent)
    .enter().append("rect")
      .attr("x", function(d,i) { return x(d.start.getTime()) })
      .attr("y", function(d,i) { return y(d.value) })
      .attr("height", function(d,i) { return 400-y(d.value) })
      .attr("width", function(d,i) {
        return x(d.start.getTime()+d.duration*1000)-x(d.start.getTime())
      });
}

ChallengeModule.prototype.end = function() { }

ChallengeModule.prototype.tick = function() { }

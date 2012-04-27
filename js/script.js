/* Author:

*/

var theData = null;

// simulation time
var demoDate = null;

// offset between current time and simulation time in millisecs
var dateOffset;

// interval timer
var timer = null;

function timerUpdate() {
  var now = new Date();
  // Calculate and display the offset time.
  demoDate = new Date(now.getTime() - dateOffset);
  $('#theDate').text(demoDate.toLocaleString());
  if(demoDate > theData.lastDate) {
    demoDate = theData.lastDate;
    alert("You have reached the end of the data. Let's start again.");
    $('#resetButton').click();
  }
}

function demoUpdate() {
  // Update our location in the dataset.
  var current = theData.current;
  while(current < theData.nReadings && theData.readings[current] < demoDate) {
    current++;
  }
  theData.current = current;
  // Draw a graph of the past 48 hours.
  $('#contentArea').empty();
  var data = theData.readings.slice(current-47,current+1);
  var graph = d3.select('#contentArea').append("svg")
    .attr("id", "exploreGraph")
    .attr("width", 600)
    .attr("height", 400);
  var x = d3.scale.linear()
    .domain([data[0].start.getTime(),data[data.length-1].start.getTime()+3600000])
    .range([0,600])
  var y = d3.scale.linear()
    .domain([2000,0])
    .range([0,400]);
  graph.selectAll("rect")
    .data(data)
    .enter().append("rect")
      .attr("x", function(d,i) { return x(d.start.getTime()) })
      .attr("y", function(d,i) { return y(d.value) })
      .attr("height", function(d,i) { return 400-y(d.value) })
      .attr("width", function(d,i) {
        return x(d.start.getTime()+d.duration*1000)-x(d.start.getTime())
      });

/*  
  var graphWidth = 700;
  var graphHeight = 300;
  var graph = d3.select('#graph')
    .append('svg:svg')
    .attr('width',graphWidth)
    .attr('height',graphHeight);
  var x = d3.time.scale()
    .domain([theData.readings[current-48].start,theData.readings[current].start])
    .range([0,graphWidth]);
  var y = d3.scale.linear()
    .domain([0,2000])
    .range([graphHeight,0]);
  graph.selectAll('rect')
    .data(theData.readings.slice(current-48,current+1))
    .enter().append('rect')
      .attr('width',10)
      .attr('height',function(d) { y(d.value) })
      .attr('x',function(d) { x(d.start) })
      .attr('y',0);
*/
}

$(document).ready(function(){

  $('#welcome').show();
  $('#intro').hide();
  $('#demo').hide();

  // Implement the welcome handler.
  $('#loadData').submit(function() {
    var target = $('input[name=url]').val();
    log('loading',target);
    // Start loading the file in the background
    $.ajax({
      type: 'GET',
      url: target,
      dataType: 'xml',
      success: function(xml) {
        log('loaded');
        theData = new GreenButtonData(xml);
        log('parsed');
        $('#welcome').hide();
        $('#intro').show();
      }
    });    
    return false; // prevent further form submission
  });

  // Implement the intro handler.
  $('#startDemo').click(function() {
    log('starting');
    $('#intro').hide();
    $('#demo').show();
    $('#resetButton').click();
  });

  // Implement the reset handler.
  $('#resetButton').click(function() {
    // Calculate the offset between current time and our start date.
    dateOffset = new Date() - theData.startDate;
    // Clear any interval timer that is already running.
    if(timer) clearInterval(timer);
    // Update now for immediate feedback.
    timerUpdate();
    // Start a new 1Hz interval timer.
    timer = setInterval(timerUpdate,1000 /* in millisecs */ );
    theData.current = 0;
    demoUpdate();
  });

  // Implement the jump handler.
  $('#jumpButton').click(function() {
    // Calculate a random jump offset in millisecs.
    var jumpOffset = (5 + 4*Math.random())*86400e3;
    dateOffset = dateOffset - jumpOffset;
    // Clear any interval timer that is already running.
    if(timer) clearInterval(timer);
    // Update now for immediate feedback.
    timerUpdate();
    // Start a new 1Hz interval timer.
    timer = setInterval(timerUpdate,1000 /* in millisecs */ );
    demoUpdate();
  });

});

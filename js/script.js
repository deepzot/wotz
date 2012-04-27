/* Author:

*/

// Represents a GreenButton IntervalReading.
function IntervalReading(xml) {
  // Convert the xml start value to a javascript date.
  var utc = new Date($(xml).find('start').text()*1000);
  this.start = new Date(utc.getTime() + utc.getTimezoneOffset()*60000);
  this.duration = Number($(xml).find('duration').text());
  this.value = Number($(xml).find('value').text());
}

// Represents a GreenButton data file.
function GreenButtonData(xml) {
  var self = this;
  this.readings = new Array();
  // Save all IntervalReading elements to memory
  // TODO: check for gaps and how daylight savings is handled
  $(xml).find('IntervalReading').each(function() {
    // Use the 'self' alias since 'this' is now hidden
    self.readings.push(new IntervalReading(this));
  });
  this.firstDate = this.readings[0].start;
  $('#firstDate').text(this.firstDate.toLocaleString());
  this.nReadings = this.readings.length;
  $('#nReadings').text(this.nReadings);
  this.lastDate = this.readings[this.nReadings-1].start;
  $('#lastDate').text(this.lastDate.toLocaleString());
  this.startDate = this.readings[this.nReadings/10].start;
  $('#startDate').text(this.startDate.toLocaleString());
  this.current = 0;
}

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
}

function demoUpdate() {
  $('#rawData').empty();
  var current = theData.current;
  while(current < theData.nReadings && theData.readings[current].start < demoDate) {
    current++;
  }
  theData.current = current;
  for(var index = current-10; index <= current; index++) {
    var reading = theData.readings[index];
    $('#rawData').append('<div>' + reading.value + ' at ' +
      reading.start.toLocaleString() + '</div>');
  }

  var data = [4, 8, 15, 16, 23, 42];
  var graph = d3.select("body").append("svg")
    .attr("class", "graph")
    .attr("width", 420)
    .attr("height", 20 * data.length);
  var x = d3.scale.linear()
    .domain([0, d3.max(data)])
    .range([0, 420]);
  graph.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("y", function(d, i) { return i * 20; })
    .attr("width", x)
    .attr("height", 20);

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

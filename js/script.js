/* Author:

*/

var readings = new Array();

// Represents a GreenButton IntervalReading as a custom object.
function IntervalReading(xml) {
  // Convert the xml start value to a javascript date.
  this.start = new Date(xml.find('start').text()*1000);
  this.value = Number(xml.find('value').text());
  if(readings.length < 10) {
    log(this.start,this.value);
  }
}

// simulation start
var startDate = new Date('January 1, 2010 9:25:00 AM PST');

// offset between current time and simulation time in millisecs
var dateOffset;

// interval timer
var timer = null;

function update() {
  var now = new Date();
  // Calculate and display the offset time.
  var then = new Date(now.getTime() - dateOffset);
  $('#theDate').text(then.toLocaleString());  
}

$(document).ready(function(){

  $('#loadData').submit(function() {
    var target = $('input[name=url]').val();
    log('loading',target);
    // Start loading the file in the background
    $.ajax({
      type: 'GET',
      url: target,
      dataType: 'xml',
      success: function(xml) {
        // Save all IntervalReading elements to memory
        // TODO: check for gaps and how daylight savings is handled
        $(xml).find('IntervalReading').each(function() {
          readings.push(new IntervalReading($(this)));
        });
        log('done loading');
      }
    });    
    return false; // prevent further form submission
  });

  // Load a GreenButton data file to use.
  /*
  */

  // Install and invoke a reset action.
  $('#resetButton').click(function() {
    // Calculate the offset between current time and our start date.
    dateOffset = new Date() - startDate;
    // Clear any interval timer that is already running.
    if(timer) clearInterval(timer);
    // Update now for immediate feedback.
    update();
    // Start a new 1Hz interval timer.
    timer = setInterval(update,1000 /* in millisecs */ );    
  }).click();

  // Install a jump action.
  $('#jumpButton').click(function() {
    // Calculate a random jump offset in millisecs.
    var jumpOffset = Math.random()*86400e3;
    dateOffset = dateOffset - jumpOffset;
    // Clear any interval timer that is already running.
    if(timer) clearInterval(timer);
    // Update now for immediate feedback.
    update();
    // Start a new 1Hz interval timer.
    timer = setInterval(update,1000 /* in millisecs */ );    
  });

});

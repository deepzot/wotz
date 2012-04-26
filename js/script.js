/* Author:

*/

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

  // Load a GreenButton data file to use.
  $.ajax({
    type: 'GET',
    url: '/gbdata/Coastal_Multi_Family_Jan_1_2011_to_Jan_1_2012.xml',
    dataType: 'xml',
    success: function(xml) {
      log('got it');
      $(xml).find('IntervalReading').each(function() {
        var when = new Date($(this).find('start').text()*1000);
        $('#rawData').append('<div>At ' + when.toUTCString() +
          ', value is ' + $(this).find('value').text() + '</div>');
      });
    }
  });

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

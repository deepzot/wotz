/* Author:

*/

// simulation start
var startDate = new Date('January 1, 2010 9:25:00 AM PST');

// offset between current time and simulation time in millisecs
var dateOffset;

// interval timer
var timer = null;

$(document).ready(function(){

  // Install and invoke a reset action.
  $('#resetButton').click(function() {
    // Display the simulation start date.
    $('#theDate').text(startDate.toLocaleString());
    // Calculate the offset between current time and our start date.
    dateOffset = new Date() - startDate;
    // Clear any interval timer that is already running.
    if(timer) clearInterval(timer);
    // Start a new 1Hz interval timer.
    timer = setInterval(function(){
      var now = new Date();
      // Calculate and display the offset time.
      var then = new Date(now.getTime() - dateOffset);
      $('#theDate').text(then.toLocaleString());
    },1000 /* in millisecs */ );    
  }).click();

  // Install a jump action.
  $('#jumpButton').click(function() {
    var jumpOffset = Math.random()*86400e3;
    dateOffset = dateOffset - jumpOffset;
  });

});

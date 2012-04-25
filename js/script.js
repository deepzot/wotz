/* Author:

*/

var theDate,dateOffset;

$(document).ready(function(){
  // Parse our start date.
  theDate = new Date($('#theDate').text());
  // Calculate the offset between current time and our start date.
  dateOffset = new Date() - theDate;  
  // Start a 1Hz interval timer.
  setInterval(function(){
    var now = new Date();
    // Calculate and display the offset time.
    var then = new Date(now.getTime() - dateOffset);
    $('#theDate').text(then.toLocaleString());
  },1000 /* in millisecs */ );
});

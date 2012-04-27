function DemoApp() {
  this.data = null;
  this.demoDate = null;
  this.dateOffset = 0;
  this.timer = null;
  this.modules = [ ];
}

DemoApp.prototype.start = function() {

  var self = this;
  
  $('#welcome').show();
  $('#intro').hide();
  $('#demo').hide();
  for(var index = 0; index < this.modules.length; index++) {
    var module = this.modules[index];
    $('#menu').append('<button id="' + module.id + '">' + module.label + '</button>');
  }

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
        self.data = new GreenButtonData(xml);
        log('parsed',self.data.startDate);
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
    log('reset',self.data.startDate);
    self.dateOffset = new Date() - self.data.startDate;
    // Clear any interval timer that is already running.
    if(self.timer) clearInterval(self.timer);
    // Update now for immediate feedback.
    self.timerUpdate();
    // Start a new 1Hz interval timer.
    self.timer = setInterval(self.timerUpdate.bind(self),1000 /* in millisecs */ );
    self.data.current = 0;
    self.demoUpdate();
  });

  // Implement the jump handler.
  $('#jumpButton').click(function() {
    // Calculate a random jump offset in millisecs.
    var jumpOffset = (5 + 4*Math.random())*86400e3;
    self.dateOffset = self.dateOffset - jumpOffset;
    // Clear any interval timer that is already running.
    if(self.timer) clearInterval(self.timer);
    // Update now for immediate feedback.
    self.timerUpdate();
    // Start a new 1Hz interval timer.
    self.timer = setInterval(self.timerUpdate.bind(self),1000 /* in millisecs */ );
    self.demoUpdate();
  });

}

DemoApp.prototype.timerUpdate = function() {
  var now = new Date();
  // Calculate and display the offset time.
  this.demoDate = new Date(now.getTime() - this.dateOffset);
  $('#theDate').text(this.demoDate.toLocaleString());
  if(this.demoDate > this.data.lastDate) {
    this.demoDate = this.data.lastDate;
    alert("You have reached the end of the data. Let's start again.");
    $('#resetButton').click();
  }
}

DemoApp.prototype.demoUpdate = function() {
  // Update our location in the dataset.
  this.data.updateCurrent(this.demoDate);
  // Grab the most recent 48 readings.
  var data = this.data.getRecent(48);
  // Draw a graph of these readings.
  $('#contentArea').empty();
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
}

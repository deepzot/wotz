function DemoApp() {
  this.data = null;
  this.demoDate = null;
  this.dateOffset = 0;
  this.timer = null;
  this.modules = [ ];
  this.module = null;
}

DemoApp.prototype.start = function() {

  var self = this;
  
  // Attach toolbar selection handlers for each of our modules.
  for(var index = 0; index < this.modules.length; index++) {
    var module = this.modules[index];
    log('installing module',module.id);
    // This double-function syntax is required to get the correct closures.
    // See http://www.mennovanslooten.nl/blog/post/62
    $('#'+module.id+'Select').click((function(m) {
      return function() {
        log('click');
        if(self.module) {
          log('ending',self.module.id);
          self.module.end();
        }
        log('starting',m.id);
        self.module = m;
        m.start(self.data);
      }
    })(module));
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
        log('parsed',self.data.nReadings,'readings');
        $.mobile.changePage($('#intro'));
      },
      error: function(jqXHR, textStatus, errorThrown) {
        log('error',textStatus,errorThrown);
        $('#loadErrorDialog').click();
      }
    });
    return false; // prevent further form submission
  });

  return;

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
    // Update our location in the dataset.
    self.data.current = 0;
    self.data.updateCurrent(self.demoDate);
    // No modules active yet.
    if(self.module) {
      self.module.button.prop('disabled',false);
      self.module = null;
    }
  });

  // Implement the jump handler.
  $('#jumpButton').click(function() {
    // Calculate a random jump offset in millisecs.
    var jumpOffset = (5 + 4*Math.random())*86400e3;
    self.dateOffset = self.dateOffset - jumpOffset;
    // Clear any interval timer that is already running.
    if(self.timer) clearInterval(self.timer);
    // Update now for immediate feedback.
    if(self.timerUpdate()) {
      // Start a new 1Hz interval timer.
      self.timer = setInterval(self.timerUpdate.bind(self),1000 /* in millisecs */ );
      // Update our location in the dataset.
      self.data.updateCurrent(self.demoDate);
      // Update the active module.
      if(self.module) self.module.update(self.data);
    }
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
    return false;
  }
  return true;
}

DemoApp.prototype.demoUpdate = function() {
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

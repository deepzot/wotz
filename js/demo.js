function DemoApp() {
  this.data = null;
  this.demoDate = null;
  this.dateOffset = 0;
  this.timer = null;
  this.modules = [ ];
  this.module = null;
}

DemoApp.prototype.start = function() {

  // Use 'self' as an alias for 'this' when we are in a context that hides 'this'
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

  // Implement the intro handler.
  $('#startDemo').click(function() {
    log('starting');
    self.reset();
    $.mobile.changePage($('#demo'));
  });
  
  // Register reset handler.
  $('#resetButton,#endOfDataDialog').click(function() { self.reset(); });

  // Register jump handler.
  $('#jumpButton').click(function() { self.jump(); });

}

DemoApp.prototype.timerUpdate = function() {
  var now = new Date();
  // Calculate and display the offset time.
  var when = new Date(now.getTime() - this.dateOffset);
  this.demoDate = when;
  var hrs = when.getHours(), hrs12 = hrs%12, mins = when.getMinutes();
  $('#theDate').text(when.toLocaleDateString() + ' ' + (hrs12 == 0 ? '12':hrs12) + ':' +
    (mins < 10 ? '0'+mins:mins) + (hrs<12?' am':' pm'));
}

DemoApp.prototype.reset = function() {
  // Calculate the offset between current time and our start date.
  log('reset',this.data.startDate);
  this.dateOffset = new Date() - this.data.startDate;
  // Clear any interval timer that is already running.
  if(this.timer) clearInterval(this.timer);
  // Update now for immediate feedback.
  this.timerUpdate();
  // Start a new 1Hz interval timer.
  var self = this;
  this.timer = setInterval(function() { self.timerUpdate(); },1000);
  // Update our location in the dataset.
  this.data.current = 0;
  this.data.updateCurrent(this.demoDate);
  // No modules active yet.
  if(this.module) {
    log('ending',this.module.id);
    this.module.end();
    log('4');
    $('#'+this.module.id+'Select').removeClass('ui-btn-active');
    this.module = null;
  }  
}

DemoApp.prototype.jump = function() {
  log('jump');
  // Calculate a random jump offset in millisecs.
  var jumpOffset = (5 + 4*Math.random())*86400e3;
  var newDate = this.data.coerceDate(new Date(this.demoDate.getTime() + jumpOffset));
  this.dateOffset = new Date() - newDate;
  // Update now for immediate feedback.
  this.timerUpdate();
  // Did this jump take us beyond the last data?
  if(this.demoDate > this.data.lastDate) {
    $('#endOfDataDialog').click();
  }
  else {
    // Clear any interval timer that is already running.
    if(this.timer) clearInterval(this.timer);
    // Start a new 1Hz interval timer.
    var self = this;
    this.timer = setInterval(function() { self.timerUpdate(); },1000);
    // Update our location in the dataset.
    this.data.updateCurrent(this.demoDate);
    // Update the active module.
    if(this.module) this.module.update(this.data);
  }
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

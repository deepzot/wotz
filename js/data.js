// Represents a GreenButton IntervalReading.
function IntervalReading(xml) {
  // Convert the xml start value to a javascript date.
  var utc = new Date($(xml).find('start').text()*1000);
  this.start = new Date(utc.getTime() + utc.getTimezoneOffset()*60000);
  this.duration = Number($(xml).find('duration').text());
  this.value = Number($(xml).find('value').text());
}

// Readings can be sorted, etc, by their start date.
IntervalReading.prototype.valueOf = function() { return this.start.valueOf(); }

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
  $('.firstDate').text(this.firstDate.toLocaleString());
  this.nReadings = this.readings.length;
  $('.nReadings').text(this.nReadings);
  this.lastDate = this.readings[this.nReadings-1].start;
  $('.lastDate').text(this.lastDate.toLocaleString());
  this.startDate = this.readings[Math.floor(this.nReadings/10)].start;
  $('.startDate').text(this.startDate.toLocaleString());
  this.current = 0;
}

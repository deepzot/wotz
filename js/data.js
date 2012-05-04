// Represents a GreenButton IntervalReading.
function IntervalReading(xml) {
  // Convert the xml start value to a javascript date.
  var utc = new Date($(xml).find('start').text()*1000);
  this.start = new Date(utc.getTime() + utc.getTimezoneOffset()*60000);
  this.value = Number($(xml).find('value').text());
}

// Readings can be sorted, etc, by their start date.
IntervalReading.prototype.valueOf = function() { return this.start.valueOf(); }

// Represents a GreenButton data file.
function GreenButtonData(xml) {
  var self = this;
  this.errorMessage = "This demonstration requires evenly spaced readings.";
  return;
  this.readings = new Array();
  // Save all IntervalReading elements to memory
  // TODO: check for gaps and how daylight savings is handled
  $(xml).find('IntervalReading').each(function() {
    // lookup the duration value of this reading
    var duration = $(this).find('duration').text();
    if(0 == self.readings.length) {
      self.duration = Number(duration);
      log('reading duration is',self.duration);
    }
    else {
      if(Number(duration) != self.duration) {
        alert("Found reading with unexpected duration " + duration);
      }
    }
    // Use the 'self' alias since 'this' is now hidden
    self.readings.push(new IntervalReading(this));
  });
  this.firstDate = this.readings[0].start;
  $('.firstDate').text(this.firstDate.toLocaleDateString());
  this.nReadings = this.readings.length;
  $('.nReadings').text(this.nReadings);
  this.lastDate = this.readings[this.nReadings-1].start;
  $('.lastDate').text(this.lastDate.toLocaleDateString());
  this.startDate = this.coerceDate(this.readings[Math.floor(this.nReadings/10)].start);
  $('.startDate').text(this.startDate.toLocaleDateString());
  this.current = 0;
}

// Updates our current reading pointer to be the last reading before the specified date.
GreenButtonData.prototype.updateCurrent = function(when) {
  while(this.current < this.nReadings && this.readings[this.current] < when) {
    this.current++;
  }
}

// Returns an array of values with length nDays*valuesPerDay where valuesPerDay <= maxValuesPerDay.
// The time period covered consists of the most recent nDays complete days (midnight to midnight).
GreenButtonData.prototype.getDays = function(nDays,maxValuesPerDay) {
  if(nDays <= 0) {
    alert("GreenButtonData.getDays: bad value of nDays = " + nDays);
    return [ ];
  }
  if(maxValuesPerDay <= 0) {
    alert("GreenButtonData.getDays: bad value of maxValuesPerDay = " + maxValuesPerDay);
    return [ ];
  }
  var grouping = 1;
  var valuesPerDay = 86400/this.duration;
  log('valuesPerDay',valuesPerDay);
  if(valuesPerDay != Math.round(valuesPerDay)) {
    alert("Readings do not divide evenly into 24 hours!");
  }
  while(valuesPerDay > maxValuesPerDay) {
    grouping++;
    valuesPerDay = 86400/(grouping*this.duration);
  }
  days = new Array(nDays*valuesPerDay);
  return days;
}

// Returns the nRecent readings ending with the current reading.
GreenButtonData.prototype.getRecent = function(nRecent) {
  return this.readings.slice(this.current-nRecent+1,this.current+1);
}

GreenButtonData.prototype.coerceDate = function(when) {
  if (when.getHours() < 6) {
    // Shift times from midnight to 6am forward into the 6am-6pm range. The net result is
    // that times from 6am-6pm are 50% more likely than dates 6pm-midnight.
    var ms = when.getTime();
    when = new Date(ms + ((ms % 2 == 0) ? 21600000:43200000));
  }
  return when;
}

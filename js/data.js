// Represents a GreenButton data file.
function GreenButtonData(xml) {
  var self = this;
  this.tzOffset = -8*3600; // assume PST=GMT-8
  this.errorMessage = null;
  this.readings = new Array();
  // Save all IntervalReading elements to memory
  // TODO: check for gaps and how daylight savings is handled
  $(xml).find('IntervalReading').each(function() {
    // lookup the start and duration values of this reading
    var start = $(this).find('start').text();
    var duration = $(this).find('duration').text();
    if(0 == self.readings.length) {
      // Record the fixed duration for readings in this file.
      self.duration = Number(duration);
      // Record the timestamp of the first reading.
      self.start = Number(start);
      log('readings start at timestamp',self.start,'with duration',self.duration);
    }
    else {
      // Check that all readings have the same duration
      if(Number(duration) != self.duration) {
        self.errorMessage = "This demonstration requires evenly spaced readings.";
        return false; // return false to prevent further .each processing
      }
      // Check that there are no gaps in the readings. Use UTC for this to avoid
      // issues with daylight savings.
      if(Number(start) != self.start + self.readings.length*self.duration) {
        log('missing data',self.readings.length,self.start,self.start + self.readings.length*self.duration,Number(start));
        self.errorMessage = "This demonstration requires a complete set of readings with no missing data.";
        return false;
      }
    }
    // Remember this reading's value
    var value = $(this).find('value').text();
    self.readings.push(Number(value));
  });
  // Give up now if there was a problem with the data content.
  if(this.errorMessage) return;
  // Insert info about this datafile into our document.
  this.firstDate = this.getDateTime(0);
  $('.firstDate').text(this.firstDate.toLocaleDateString());
  this.nReadings = this.readings.length;
  $('.nReadings').text(this.nReadings);
  this.lastDate = this.getDateTime(this.nReadings);
  $('.lastDate').text(this.lastDate.toLocaleDateString());
  this.startIndex = this.coerceIndex(Math.floor(this.nReadings/10));
  this.startDate = this.getDateTime(this.startIndex);
  $('.startDate').text(this.startDate.toLocaleString());
  this.current = this.startIndex;
}

// Returns the date and time corresponding to the specified reading index.
GreenButtonData.prototype.getDateTime = function(index) {
  return new Date(1000*(this.start + index*this.duration - this.tzOffset));
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

GreenButtonData.prototype.coerceIndex = function(index) {
  var when = this.getDateTime(index);
  var hour = when.getHours();
  if (hour < 6) {
    // Shift times from midnight to 6am forward into the 6am-6pm range. To make this
    // roughly random, pick 6am-noon vs noon-6pm based on the date. The net result is
    // that times from 6am-6pm are 50% more likely than dates 6pm-midnight.
    var hoursToAdvance = ((when.getMonth() + when.getDate()) % 2 == 0) ? 6 : 12;
    index += (hoursToAdvance*3600)/this.duration;
  }
  return index;
}

// Represents a GreenButton data file.
function GreenButtonData(xml) {
  var self = this;
  this.tzOffset = -5*3600; // assume EST=GMT-5
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
      // Check that there are no gaps in the readings.
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
  // Set our current position.
  this.nReadings = this.readings.length;
  this.startIndex = this.coerceIndex(Math.ceil((7*86400)/this.duration));
  this.reset();
  // Insert info about this datafile into our document.
  this.firstDate = this.getDateTime(0);
  $('.firstDate').text(this.firstDate.toLocaleDateString());
  $('.nReadings').text(this.nReadings);
  this.lastDate = this.getDateTime(this.nReadings);
  $('.lastDate').text(this.lastDate.toLocaleDateString());
  this.startDate = this.getDateTime(this.startIndex);
  $('.startDate').text(this.startDate.toLocaleString());
}

// Returns the average energy consumption by hour of the day (0-23) for the data seen so far.
GreenButtonData.prototype.averageByHour = function(hour) {
  return (this.byHourCount[hour] > 0) ? this.byHourSum[hour]/this.byHourCount[hour] : 0;
}

// Returns the average energy consumption by day of the week (0-6) for the data seen so far.
GreenButtonData.prototype.averageByWeekDay = function(day) {
  return (this.byWeekDayCount[day] > 0) ? this.byWeekDaySum[day]/this.byWeekDayCount[day] : 0;
}

// Updates our current position in the datafile.
GreenButtonData.prototype.updateCurrent = function(index) {
  while(this.current < index) {
    var value = this.readings[this.current];
    var when = this.getDateTime(this.current);
    var hour = when.getHours();
    this.byHourSum[hour] += value;
    this.byHourCount[hour]++;
    var day = when.getDay();
    this.byWeekDaySum[day] += value;
    this.byWeekDayCount[day]++;
    this.current++;
  }
  /*
  for(var day = 0; day < 7; ++day) {
    log('day avg',day,this.averageByWeekDay(day));
  }
  for(var hour = 0; hour < 24; ++hour) {
    log('hour avg',hour,this.averageByHour(hour));
  }
  */
}

GreenButtonData.prototype.reset = function() {
  this.current = 0;
  // Reset arrays that accumulate readings by hour and day of the week
  this.byHourSum = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.byHourCount = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.byWeekDaySum = [0,0,0,0,0,0,0];
  this.byWeekDayCount = [0,0,0,0,0,0,0];
  this.updateCurrent(this.startIndex);
}

// Returns the date and time corresponding to the specified reading index.
GreenButtonData.prototype.getDateTime = function(index) {
  return new Date(1000*(this.start + index*this.duration - this.tzOffset));
}

// Returns an array of energy readings covering the most recent (relative to this.current)
// nDays complete 24 hour periods, ending at midnight.
GreenButtonData.prototype.getDays = function(nDays) {
  if(nDays <= 0) {
    alert("GreenButtonData.getDays: bad value of nDays = " + nDays);
    return [ ];
  }
  var when = this.getDateTime(this.current);
  var hour = when.getHours();
  var lastIndex = this.current - Math.round((hour*3600)/this.duration);
  var firstIndex = lastIndex - Math.round(nDays*(86400/this.duration));
  log('getDays returning period from',this.getDateTime(firstIndex),'to',this.getDateTime(lastIndex));
  return this.readings.slice(firstIndex,lastIndex);
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

// Represents a GreenButton data file.
function GreenButtonData(xml) {
  var self = this;
  this.tzOffset = -8*3600; // assume PST=GMT-8
  this.errorMessage = null;
  this.readings = new Array();
  this.dateOffset = 0;
  // Loop over all IntervalReading elements...
  $(xml).find('IntervalReading').each(function() {
    // lookup the start and duration values of this reading
    var start = $(this).find('start').text();
    var duration = $(this).find('duration').text();
    if(0 == self.readings.length) {
      // Record the fixed duration for readings in this file.
      self.duration = Number(duration);
      // Check that an hour consists of an exact number of readings (possibly one)
      if(3600 % self.duration != 0) {
        self.errorMessage = "This demonstration does not support non-standard reading durations.";
        return false;
      }
      // Calculate and save the number of readings per hour and per day.
      self.readingsPerHour = 3600/self.duration;
      self.readingsPerDay = 24*self.readingsPerHour;
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

    if(value > this.maxValue) this.maxValue = value;

    var hour = when.getHours();
    this.byHourSum[hour] += value;
    this.byHourCount[hour]++;

    var day = when.getDay();
    this.byWeekDaySum[day] += value;
    this.byWeekDayCount[day]++;
    this.current++;
  }
}

GreenButtonData.prototype.reset = function() {
  this.current = 0;
  // Reset arrays that accumulate readings by hour and day of the week
  this.byHourSum = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.byHourCount = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.byWeekDaySum = [0,0,0,0,0,0,0];
  this.byWeekDayCount = [0,0,0,0,0,0,0];
  this.maxValue = 0;
  this.updateCurrent(this.startIndex);
}

// Returns the date and time corresponding to the specified reading index. If no index is
// specified, uses the current index, as maintained by updateCurrent().
GreenButtonData.prototype.getDateTime = function(index) {
  index = typeof index !== 'undefined' ? index : this.current;
  return new Date(1000*(this.start + index*this.duration - this.tzOffset));
}

// Returns an array of energy readings covering a range of days specified by (first,last)
// in units of relative days, where 0 corresponds to the most recent (relative to this.current)
// occurence of midnight, -1 refers to the previous midnight, etc. For example, to fetch the last
// two complete days of readings, use getDays(-2,0). A value of last > 0 is truncated to last=0.
// Each reading represents a fixed time interval of this.duration (in seconds),
// which might not equal 1 hour (3600s). If an Array is provided via the optional range parameter,
// elements [0] and [1] will be filled with the reading index values for the first and last+1
// readings returned.
GreenButtonData.prototype.getDays = function(first,last,range) {
  if(last > 0) last = 0;
  if(first >= last) return [ ];
  var when = this.getDateTime(this.current);
  var hour = when.getHours();
  var lastIndex = this.current - hour*this.readingsPerHour + last*this.readingsPerDay;
  var firstIndex = lastIndex - (last-first)*this.readingsPerDay;
  log('getDays returning period from',this.getDateTime(firstIndex),'to',this.getDateTime(lastIndex));
  if(typeof range !== 'undefined') {
    range[0] = firstIndex;
    range[1] = lastIndex; // this is one beyond the last reading returned!
  }
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

// Returns the current simulation time, based on an offset real-time clock.
GreenButtonData.prototype.getSimulationTime = function() {
  var now = new Date();
  return new Date(now.getTime() - this.dateOffset);
}

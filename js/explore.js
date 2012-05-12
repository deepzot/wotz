function ExploreModule() {
  this.id = 'explore';
  this.label = 'Explore';
  this.dataSource = null;
  this.displayData = null;
  this.displayRange = [ null,null ];
  // Reset messaging and callouts.
  this.messageCount = 0;
  this.currentMessage = null;
  this.currentCallout = null;
  this.getNextMessage();
  // Number formatting helper.
  this.format = d3.format(".1f");
}

ExploreModule.prototype.start = function(data,settings) {
  log('explore start at',data.getDateTime());
  // Remember our data source and settings.
  this.dataSource = data;
  this.settings = settings;
  // Grab the most recent 2 complete days of data.
  this.dayOffset = 0;
  this.landHeight = null;
  this.getData();
  // Add a hide/show text UI element in the footer.
  var footer = $('#demo div[data-role="footer"]');
  footer.append('<a id="exploreMsgOnOff" href="#" data-role="button" data-mini="true">hide messages</a>')
    .trigger('create');
  this.messagesVisible = true;
  self = this;
  $('#exploreMsgOnOff').click(function() {
    if(self.messagesVisible) {
      self.messagesVisible = false;
      self.graphics.setMessageOpacity(0);
      $('#exploreMsgOnOff .ui-btn-text').text('show messages');
    }
    else {
      self.messagesVisible = true;
      self.graphics.setMessageOpacity(1);
      $('#exploreMsgOnOff .ui-btn-text').text('hide messages');
    }
    return false;
  });
}

ExploreModule.prototype.end = function() {
  this.displayData = null;
  // Clean up the footer.
    $('#exploreMsgOnOff').remove();
}

ExploreModule.prototype.update = function(container) {
  var self = this;
  // Create a new SVG graphics element that fills our container.
  var graphics = new Graphics(container,'exploreGraph');
  // Remember our container and graphics for redrawing things later.
  this.container = container;
  this.graphics = graphics;
  // Create a pair of radial sun gradients.
  graphics.addGradient('radial',
    {class:'sunGradient',gradientUnits:'userSpaceOnUse',cx:'25%',cy:'8%',r:'10%'},
    [
      [  '0%','rgb(255,245,140)','0.75'],
      ['100%','rgb(255,245,140)','0']
    ]);
  var leftSun = $('.sunGradient');
  var rightSun = leftSun.clone().insertAfter(leftSun);
  leftSun.attr('id','leftSun');
  rightSun.attr('id','rightSun').attr('cx','75%');
  // Create a linear sea gradient.
  graphics.addGradient('linear',
    {id:'seaGradient',gradientUnits:'objectBoundingBox',x1:'0%',y1:'0%',x2:'0%',y2:'100%'},
    [
      [  '0%','rgb(75,120,100)','1'],
      [ '15%','rgb(50,100,100)','1'],
      ['100%','#4F3BB5','1']
    ]);
  // Create a linear hill gradient.
  graphics.addGradient('linear',
    {id:'hillGradient',gradientUnits:'objectBoundingBox',x1:'0%',y1:'100%',x2:'0%',y2:'0%'},
    [
      [  '0%','#B5A58B','1'],
      [ '20%','#4BB54E','1'],
      ['100%','#4BB54E','1']
    ]);
  // Prepare axis scaling functions.
  this.xScale = d3.scale.linear()
    .domain([0,48])
    .range([0,graphics.width]);
  this.yScale = d3.scale.linear()
    .domain([0,self.dataSource.maxValue])
    .range([graphics.height-1,0]);
  // Draw the background sky.
  graphics.graph.append('svg:rect')
    .attr('id','exploreSky')
    .attr('x',0)
    .attr('y',0)
    .attr('width',graphics.width)
    .attr('height',graphics.height);
  graphics.graph.append('svg:rect')
    .attr('fill','url(#leftSun)')
    .attr('x',0)
    .attr('y',0)
    .attr('width',graphics.width/2)
    .attr('height',graphics.height);
  graphics.graph.append('svg:rect')
    .attr('fill','url(#rightSun)')
    .attr('x',graphics.width/2)
    .attr('y',0)
    .attr('width',graphics.width/2)
    .attr('height',graphics.height);
  // Draw land heights.
  var land = d3.svg.area()
    .x(function(d,i) { return self.xScale((i-0.5)/self.dataSource.readingsPerHour); })
    .y0(self.yScale(this.minValue))
    .y1(function(d,i) { return self.yScale(d); })
    .interpolate('linear');
  var hills = d3.svg.area()
    .x(function(d,i) { return self.xScale(i-0.5); })
    .y0(land.y0())
    .y1(land.y1())
    .interpolate('basis');
  graphics.graph.append('svg:path')
    .attr('class','land1')
    .attr('d',land(this.landHeight));
  graphics.graph.append('svg:path')
    .attr('class','land2')
    .attr('d',land(this.landHeight2));
  graphics.graph.append('svg:path')
    .attr('fill','url(#hillGradient)')
    .attr('d',hills(this.landHeight3));
  // Draw a base-load sea level.
  var nCycles = 8;
  var seaAmplitude = 0.025;
  var seaData = [ [0,1+seaAmplitude] ];
  var seaX = d3.scale.linear().domain([0,nCycles]).range([0,graphics.width]);
  for(var cycle = 0; cycle < nCycles; ++cycle) {
    seaData.push([seaX(cycle+0.25),1+2*seaAmplitude]);
    seaData.push([seaX(cycle+0.50),1+seaAmplitude]);
    seaData.push([seaX(cycle+0.75),1]);
    seaData.push([seaX(cycle+1.00),1+seaAmplitude]);
  }
  var sea = d3.svg.area()
    .x(function(d,i) { return d[0]; })
    .y1(function(d,i) { return self.yScale(self.minValue*d[1]); })
    .y0(graphics.height)
    .interpolate('basis');
  graphics.graph.append('svg:path')
    .attr('fill','url(#seaGradient)')
    .attr('d',sea(seaData));
  // Add time-of-day labels.
  var labelPos = null;
  var timeLabels = graphics.graph.selectAll('text.timeLabel');
  // Use 4 or 7 labels, depending on how much space we have available.
  if(graphics.width > 500) {
    timeLabels = timeLabels.data(['6am','noon','6pm','midnight','6am','noon','6pm']);
    labelPos = function(d,i) { return self.xScale(6*(i+1)); };
  }
  else {
    timeLabels = timeLabels.data(['6am','6pm','6am','6pm']);
    labelPos = function(d,i) { return self.xScale(12*i+6); };
  }
  timeLabels.enter().append('svg:text')
    .attr('class','timeLabel')
    .text(function(d,i) { return d; })
    .attr('x', labelPos)
    .attr('y', graphics.height-graphics.fontSize);
  // Add vertical lines for each hour label.
  timeLabels.enter().append('svg:line')
    .attr('class','timeLine')
    .attr('x1',labelPos).attr('x2',labelPos)
    .attr('y1',0.5*graphics.fontSize)
    .attr('y2',function(d,i) { return graphics.height- (d=='noon' ? 5:2.5)*graphics.fontSize; });
  // Add day-of-week labels.
  var weekDay = d3.time.format('%a');
  var fullDate = d3.time.format('%m/%d');
  var formatter = null;
  if(this.dayOffset > -6) {
    // Display abbreviated day of the week for the past week.
    formatter = function(d,i) { return weekDay(self.dataSource.getDateTime(d)); };
  }
  else {
    // Display MM/DD for days more than a week ago.
    formatter = function(d,i) { return fullDate(self.dataSource.getDateTime(d)); }
  }
  var dayData = [
    this.displayRange[0] + 12*this.dataSource.readingsPerHour,
    this.displayRange[1] - 12*this.dataSource.readingsPerHour ];
  this.dayLabel = [ formatter(dayData[0]), formatter(dayData[1]) ];
  graphics.graph.selectAll('text.dayLabel')
    .data(dayData)
    .enter().append('svg:text')
      .attr('class','dayLabel')
      .text(formatter)
      .attr('x', function(d,i) { return self.xScale(24*i+12); })
      .attr('y', graphics.height-3*graphics.fontSize);
  // Add navigation labels.
  if(this.displayRange[0] >= this.dataSource.readingsPerDay) {
    graphics.graph.append('svg:text')
      .attr('class','leftArrow')
      .text('<')
      .attr('x',self.xScale(0.5))
      .attr('y', graphics.height-3*graphics.fontSize)
      .on('click', function() { self.navBack(); });
  }
  if(this.displayRange[1] <= this.dataSource.current - this.dataSource.readingsPerDay) {
    graphics.graph.append('svg:text')
      .attr('class','rightArrow')
      .text('>')
      .attr('x',self.xScale(47.5))
      .attr('y', graphics.height-3*graphics.fontSize)
      .on('click', function() { self.navForward(); });
  }
  // Show the current message and any associated callout.
  this.showMessage();
}

ExploreModule.prototype.showMessage = function() {
  var fade = (this.messageCount != this.lastMessageCount);
  var labelBox = $('.dayLabel')[0].getBBox();
  var message = this.graphics.showMessage(this.currentMessage,fade,0,labelBox.y);
  if(!this.messagesVisible) this.graphics.setMessageOpacity(0);
  this.lastMessageCount = this.messageCount;
  var self = this;
  message.on('click',function() {
    if(self.messagesVisible) {
      self.getNextMessage();
      self.showMessage();
    }
  });
  // Show the current callout.
  this.graphics.clearCallouts();
  var call = this.currentCallout;
  if(call) {
    this.graphics.addCallout(this.xScale(call.x),this.yScale(call.y),{ url:call.url });
  }
}

ExploreModule.prototype.getNextMessage = function() {
  var msg,call=null;
  switch(++this.messageCount) {
  case 1:
    msg = ['Welcome to your','energy-use landscape.','Touch to continue...'];
    break;
  case 2:
    msg = ['The sea level shows your','base consumption by','things that are always on.'];
    call = { x:9, y:this.minValue };
    break;
  case 3:
    msg = ['The skyline shows your','peak consumption by','things that turn on and off.'];
    var hr = 24+18; // 6pm on second day
    call = { x:hr, y:this.getConsumption(hr) };
    break;
  case 4:
    var total = (this.dayUsage[0]+this.dayUsage[1])/2;
    var basePercent = this.format(100*this.baseLoad/total);
    msg = [ 'Base consumption is '+basePercent+'% of your total.',
      'Any savings here make a big difference.' ];
    break;
  case 5:
    msg = [ 'Your landscape tells the story', 'of your energy behavior each day.',
      'Let your data do the talking...' ];
    break;
  case 6:
    msg = ['You are viewing the last',' two days. Use the arrow below', 'to go back in time.'];
    break;
  case 7:
    msg = ['Use the button below to','hide or show these messages.'];
    break;
  case 8:
    msg = ['Some clouds have silver', 'linings. Click one for more', 'information on a topic.'];
    call = { x:2.5, y:0.95*this.dataSource.maxValue, url: this.settings.moreInfoURL };
    break;
  case 9:
    msg = ['Your electricity bill measures', 'energy in "kWh". What\'s that??' ];
    break;
  case 10:
    var day = this.getRandomDay();
    msg = ['1 kWh = 1 bacon double cheeseburger.',
      'You consumed '+this.format(this.dayUsage[day])+' cheeseburgers on '+this.dayLabel[day]+'.'];
    break;
  case 11:
    var day = this.getRandomDay();
    // Typical roof area is asumed to be 40' x 60' = 223 m^2.
    // We assume pwr=1 kW/m^2 of full sunshine, so dt = 3600(1/area/pwr) in seconds.
    var area = 223, pwr = 1, eff = 0.15;
    var dt = 60*this.dayUsage[day]/eff/area/pwr; // convert to minutes
    msg = ['1 kWh = 16 seconds of', 'full sunshine on a typical roof.',
      'Your energy use on '+this.dayLabel[day]+' is '+this.format(dt)+' mins',
      '(for typical solar panels).' ];
    call = { x:24*day+12, y: 0.92*this.dataSource.maxValue };
    break;
  default:
    msg = ['Here is message','number '+this.messageCount];
  }
  this.currentMessage = msg;
  if(call && !('url' in call)) call.url = null;
  this.currentCallout = call;
}

ExploreModule.prototype.getShareText = function() {
  return this.currentMessage.join(' ');
}

ExploreModule.prototype.getRandomDay = function() {
  return Math.random() < 0.5 ? 0 : 1;
}

// Fetches and analyzes the data corresponding to this.dayOffset
ExploreModule.prototype.getData = function() {
  // Fetch the data from our source.
  this.displayData = this.dataSource.getDays(this.dayOffset-2,this.dayOffset,this.displayRange);
  // Find the minimum reading.
  var size = this.displayData.length;
  var minValue = this.dataSource.maxValue;
  this.dayUsage = [ 0,0 ]; // measures kWh/day for each of the two displayed days
  for(var i = 0; i < size; ++i) {
    var value = this.displayData[i];
    if(value < minValue) minValue = value;
    var day = Math.floor(i/this.dataSource.readingsPerDay);
    this.dayUsage[day] += 1e-3*value; // convert Wh to kWh
  }
  this.minValue = minValue;
  // Calculate base load in kWh/day.
  this.baseLoad = 1e-3*this.minValue*this.dataSource.readingsPerDay;
  log('getData',this.baseLoad,this.dayUsage);
  // Calculate an array of land heights.
  if(this.landHeight == null) {
    this.landHeight = new Array(size+2);
    this.landHeight2 = new Array(size+2);
    this.landHeight3 = new Array(48+2);
  }
  this.landHeight[0] = this.landHeight[size+1] = minValue;
  this.landHeight2[0] = this.landHeight2[size+1] = minValue;
  for(var i = 0; i < size; ++i) {
    this.landHeight[i+1] = Math.max(this.displayData[i],minValue);
    this.landHeight2[i+1] = (this.landHeight[i+1]-minValue)*(0.75+0.25*Math.random()) + minValue;
  }
  this.landHeight3[0] = this.landHeight3[49] = minValue;
  for(var i = 0; i < 24; ++i) {
    var hourAvg = this.dataSource.averageByHour(i);
    hourAvg = minValue + 0.5*(hourAvg - minValue);
    hourAvg = Math.max(hourAvg,minValue);
    this.landHeight3[i+1] = this.landHeight3[i+25] = hourAvg;
  }
}

// Returns the consumption rate in Watts for the specified hour offset relative to the
// start of the two days being display, ie, the input range is [0,48). Fractional
// hour offsets are allowed and will take advantage of multiple samples per hour
// if these are available.
ExploreModule.prototype.getConsumption = function(hourOffset) {
  var index = Math.floor(this.dataSource.readingsPerHour*hourOffset);
  if(index < 0 || null == this.displayData || index >= this.displayData.length) return 0;
  return this.displayData[index];
}

// Handles a request to view earlier data.
ExploreModule.prototype.navBack = function() {
  this.dayOffset--;
  this.getData();
  this.update(this.container);
}

// Handles a request to view more recent data.
ExploreModule.prototype.navForward = function() {
  this.dayOffset++;
  this.getData();
  this.update(this.container);
}

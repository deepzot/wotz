function ChallengeModule() {
  this.id = 'challenge';
  this.label = 'Take a Challenge';
  this.dataSource = null;
  this.hourlyData = new Array(12);
  this.timer = null;
  // Reset messaging sequencer.
  this.messageCount = 0;
  this.currentMessage = null;
  this.getNextMessage();
  this.selectedHour = null;
  // Number formatting helper.
  this.format0 = d3.format(".0f");
  this.format1 = d3.format(".1f");
  this.hourLabels = [
    'midnight','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
    'noon','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'
  ];
}

ChallengeModule.prototype.start = function(data) {
  log('challenge start at',data.getDateTime());
  // Remember our data source.
  this.dataSource = data;
  this.maxHourly = 0;
  this.minHourly = 1e9;
  var now = new Date();
  var hour = now.getHours();
  for(var offset = 0; offset < 12; ++offset) {
    var value = this.dataSource.averageByHour((hour + offset)%24);
    this.hourlyData[offset] = value;
    if(value < this.minHourly) this.minHourly = value;
    if(value > this.maxHourly) this.maxHourly = value;
  }
  self = this;
  this.hourOrigin24 = hour;
  this.hourOrigin = hour % 12;
  // Returns the angle in radians (relative to 12 o'clock) corresponding to the start of the
  // hour stored in this.hourlyData[index]. Use index+1 to get the ending angle.
  this.angleMap = function(index) {
    return (index+self.hourOrigin)*Math.PI/6;
  }
}

ChallengeModule.prototype.end = function() { }

ChallengeModule.prototype.update = function(container) {
  var self = this;
  // Create a new SVG graphics element that fills our container.
  var graphics = new Graphics(container,'challengeGraph');
  this.graphics = graphics;
  // Draw a background rectangle.
  graphics.graph.append('svg:rect')
    .attr('id','challengeBackground')
    .attr('width',graphics.width)
    .attr('height',graphics.height);
  // Define a gradient for the usage histogram.
  graphics.addGradient('radial',
    {id:'usageGradient',gradientUnits:'userSpaceOnUse',cx:'0%',cy:'0%',r:'50%'},
    [
      ['50%','#B5A58B','1'],
      ['70%','#4A4439','1']
    ]);
  // Draw a clock face.
  var clock = graphics.graph.append('svg:g');
  this.clock = clock;
  var radius = 0.49*Math.min(graphics.height,graphics.width);
  var rlabel = 0.5*radius - 1.5*graphics.fontSize;
  clock.append('svg:circle')
    .attr('id','clockCircle')
    .attr('cx',graphics.width/2)
    .attr('cy',graphics.height/2)
    .attr('r',radius/2);
  clock.selectAll('text.clockLabel')
    .data([12,3,6,9])
    .enter().append('svg:text')
      .attr('class','clockLabel')
      .text(function(d) { return d; })
      .attr('x',function(d,i) { return graphics.width/2 + rlabel*Math.sin(d*Math.PI/6); })
      .attr('y',function(d,i) { return graphics.height/2 - rlabel*Math.cos(d*Math.PI/6) + 0.7*graphics.fontSize; });
  clock.selectAll('line.clockTick')
    .data([1,2,4,5,7,8,10,11])
    .enter().append('svg:line')
      .attr('class','clockTick')
      .attr('x1',graphics.width/2)
      .attr('x2',graphics.width/2)
      .attr('y1',graphics.height/2-rlabel-0.5*graphics.fontSize)
      .attr('y2',graphics.height/2-rlabel)
      .attr('transform',function(d) {
        return 'rotate('+(30*d)+','+(graphics.width/2)+','+(graphics.height/2)+')';
      });
  // Start real-time clock hands going.
  clock.selectAll('line.clockHand')
    .data([0,0,0])
    .enter().append('svg:line')
      .attr('class','clockHand')
      .attr('opacity',0)
      .attr('id',function(d,i) { return 'clockHand'+i; })
      .attr('x1',graphics.width/2)
      .attr('y1',graphics.height/2+graphics.height/50)
      .attr('x2',graphics.width/2)
      .attr('y2',function(d,i) { return graphics.height/2 - ((i==0)? 0.35*radius : 0.45*radius); });
  if(this.timer) clearInterval(this.timer);
  this.timer = setInterval(function() {
    var now = new Date();
    // Only hour hand moves continuously.
    var mins = now.getMinutes();
    var hands = [ (now.getHours()%12 + mins/60)/12, mins/60, now.getSeconds()/60 ];
    clock.selectAll('line.clockHand').data(hands)
      .attr('opacity',1)
      .attr('transform',function(d) { return 'rotate('+360*d+','+graphics.width/2+','+graphics.height/2+')'});
  },1000);
  // Draw average hourly usage around the clock face.
  var gap = graphics.fontSize/2;
  // Returns the radius in SVG coordinates corresponding to the specified hourly usage.
  this.radiusMap = function(usage) {
    return radius/2+gap + (radius/2-gap)*usage/self.maxHourly;
  }
  var hourlyArc = d3.svg.arc()
    .innerRadius(radius/2+graphics.fontSize/2)
    .outerRadius(function(d) { return self.radiusMap(d); })
    .startAngle(function(d,i) { return self.angleMap(i); })
    .endAngle(function(d,i) { return self.angleMap(i+1); });
  var hourlyDataG = clock.append('svg:g');
  hourlyDataG.selectAll('path.hourlyArc')
    .data(this.hourlyData)
    .enter()
    .append('svg:path')
      .attr('class','hourlyArc')
      .attr('fill','url(#usageGradient)')
      .attr('opacity',function(d,i) { return 1-i/24; })
      .attr('d',hourlyArc)
      .on('click',function(d,i) {
        if(self.currentMessage == null) {
          self.selectedHour = i;
          d3.select(this).attr('fill','#4BB54E');
          self.getNextMessage();
          self.showMessage();
        }
      });
  hourlyDataG.attr('transform','translate('+graphics.width/2+','+graphics.height/2+')');
  // Show the current message.
  this.showMessage();
}

ChallengeModule.prototype.showMessage = function() {
  var self = this;
  if(this.currentMessage) {
    // Fade out the clock so we can see the text above it.
    this.clock.attr('opacity',0.25);
    // Display the current message.
    var fade = (this.messageCount != this.lastMessageCount);
    var message = this.graphics.showMessage(this.currentMessage,fade);
    this.lastMessageCount = this.messageCount;
    // Don't show pointer when mouse is over hour sectors if message is displayed.
    $('.hourlyArc').css('cursor','default');
    // Click anywhere to advance the sequencer...
    this.graphics.setClickAnywhere(function() {
      self.getNextMessage();
      self.showMessage();
    });
  }
  else {
    // Restore the fill of any selected hour.
    if(this.selectedHour) {
      $('.hourlyArc:nth-child('+(this.selectedHour+1)+')').attr('fill','url(#usageGradient)');
    }
    this.graphics.clearClickAnywhere();
    this.graphics.removeMessageGroup();
    this.clock.attr('opacity',1);
    $('.hourlyArc').css('cursor','pointer');
  }
}

ChallengeModule.prototype.getNextMessage = function() {
  var msg;
  switch(++this.messageCount) {
  case 1:
    msg = ['Ready for an','energy challenge?','Touch to continue...'];
    break;
  case 2:
    msg = [
      'Try saving "embodied" energy',
      'before you use it...'];
    break;
  case 3:
    msg = [
      'Embodied energy is the total',
      'energy needed to create, transport,',
      'and dispose of something.'];
    break;
  case 4:
    msg = [
      'Save one hour of embodied energy',
      'to cover the energy cost of',
      'owning something for one hour.'];
    break;
  case 5:
    msg = ['The clock border shows your','predicted energy use over','the next 12 hours.'];
    break;
  case 6:
    var range = this.format1(1e-3*this.minHourly)+'-'+this.format1(1e-3*this.maxHourly)+' kWh';
    msg = ['The size of each box represents','your average hourly usage','(in the range '+range+').'];
    break;
  case 7:
    msg = ['Select an hour for','your next challenge...'];
    break;
  default:
    if(this.currentMessage != null) {
      // Hide the existing message to allow a new hour selection
      msg = null;
    }
    else {
      // Generate a new message based on the current selection...
      // Generate a time range message
      var hour = (this.hourOrigin24 + this.selectedHour)%24;
      var range = this.hourLabels[hour] + '-' + this.hourLabels[(hour+1)%24];
      // Lookup the average consumption for this hour of the day.
      var usage = this.dataSource.averageByHour(hour);
      // Scan the possible challenges to find the most ambitious one possible (savings <= 60%)
      var maxCost = 0.6*usage;
      if(challengeData[0].cost > maxCost) {
        msg = ['You barely used any energy from '+range,'Congratulations!'];
        break;
      }
      var lastIndex = 0;
      while(lastIndex < challengeData.length-1 && challengeData[lastIndex+1].cost <= maxCost) {
        lastIndex++;
      }
      // Pick a random challenge
      var index = Math.floor(lastIndex*Math.random());
      var target = challengeData[index];
      // Calculate the savings fraction required. If it is less than 60/24=0.025, change the time
      // period from from 1 hour to 1 day.
      var line3 = null, savings = null;
      if(target.cost < 0.025*usage) {
        line3 = 'one day\'s embodied energy of';
        savings = this.format0(2400*target.cost/usage)+'%';
      }
      else {
        line3 = 'one hour\'s embodied energy of';
        savings = this.format0(100*target.cost/usage)+'%';
      }
      msg = [
        'Use '+savings+' less electricity',
        'from ' + range+' to save',
        line3,
        target.what+'.'
      ];
    }
  }
  this.currentMessage = msg;
}

ChallengeModule.prototype.getShareText = function() {
  return this.currentMessage.join(' ');
}

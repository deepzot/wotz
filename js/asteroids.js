function Asteroids() {
	this.id = 'asteroids';
	this.label = 'Asteroids';
	this.degrees = 180 / Math.PI;
	this.x = null;
	this.y = null;
	this.maxBaddies = 3;
	this.spawnDelay = 10*1000;
  this.currentState = null;
	// Data
	this.dataSource = null;
  this.displayData = null;
  this.displayRange = [ null,null ];
  this.introMessageCount = null;
  this.messageLimit = 6;
}

Asteroids.prototype.gameStates = {
  PAUSE : {value: 0, name: "Pause"}, 
  READY: {value: 1, name: "Ready"}, 
  RUNNING : {value: 2, name: "Running"},
  LOSE : {value: 3, name: "Lose"},
  INTRO : {value: 4, name: "Intro"}
};

Asteroids.prototype.start = function(data) { 
	var self = this;
	this.dataSource = data;
	if( this.currentState == null) {
		this.setState(this.gameStates.READY);
	}
	log("Hello from Asteroids!");
	this.getData();
	// Listen for keydown events
	d3.select(window).on("keydown", function() {
			var keyCode = d3.event.keyCode;
			if(keyCode == 32) {
				if(self.currentState == self.gameStates.PAUSE) {
					self.setState(self.gameStates.RUNNING);
				}
				else if(self.currentState == self.gameStates.RUNNING){
					self.setState(self.gameStates.PAUSE);
				}
				else if(self.currentState == self.gameStates.LOSE){
					self.setState(self.gameStates.READY);
				}
				else if(self.currentState == self.gameStates.READY){
					self.setState(self.gameStates.RUNNING);
				}
			}
	});
}

Asteroids.prototype.positionLoop = function() {
	var self = this;
	// The heartbeat
	d3.timer(function() {
		// break condition
		if (self.currentState != self.gameStates.RUNNING) {
			return true;
		}
		// Update baddie positions
		self.updateBaddiePositions();
		self.updateFiredShotsPositions();
		self.totalLiveBaddies = self.baddies.length + self.baddiesBase.length + self.baddiesAvg.length;
		
		if(self.totalLiveBaddies == 0) {
			self.lastSpawn = self.spawnDelay;
		}
		// Check time
		var d = new Date();
		var time = d.getTime();
		if (time - self.lastSpawn > self.spawnDelay) {
			self.spawn();
			self.lastSpawn = time;
			graphics = self.graphics;
			if( self.hourOffset < self.values.length ) {
				self.hourOffset++;
			}
			else {
				// Get data from previous day
				self.dayOffset--;
				self.getData();
				// new round?
				self.setState(self.gameStates.PAUSE);
				self.initNewRound();
				self.showMessage();
				// Draw histogram
				var hist = graphics.graph.selectAll('rect.hist')
					.data(self.values);
				hist.enter().append('svg:rect')
					.attr('class','hist')
					.attr('x', function(d,i) { return self.x(i/24) })
					.attr('width', self.x(1/24) )
					.style('fill','#B5A58B');
				hist
					.attr('y', function(d) { return self.histy(d) })
					.attr('height', function(d) { return graphics.height - self.histy(d) });
				hist.exit().remove();					
			}
			// Draw hour label
			graphics.graph.selectAll('text.hourLabel')
				.data([self.hourOffset])
				.transition()
				.text(function(d) { 
					format = d3.time.format("%I %p");
					return format(new Date(2012, 1, 5, d-1));
					})
				.attr('x', function(d) { return self.x((d-1+.5)/24); })
				.style('opacity',1);
		}
		// Update svg elements
		self.redraw();
	});
}

// This function is used to both pause and unpause timers
Asteroids.prototype.toggleTimers = function() {
	var d = new Date();
	var time = d.getTime();
	this.lastSpawn = time - this.lastSpawn;
}

Asteroids.prototype.updateBaddiePositions = function() {
	// Wall pads
	var padx = this.padx;
	var pady = this.pady;
	// Update baddie positions
	for (var i = 0; i < this.baddiesBase.length; i++) {
		var baddie = this.baddiesBase[i],
				path = baddie.path,
				dx = baddie.vx,
				dy = baddie.vy,
				x = path[0] += dx,
				y = path[1] += dy;
		// Wrap around the walls.
		if (x < 0-padx || x > 1+padx) path[0] = Math.abs(1 - x);
		if (y < 0-pady || y > 1+pady) path[1] = Math.abs(1 - y);
		if(this.isCollision({x:this.x(x),y:this.y(y)},{x:this.x(.5),y:this.y(.5)},baddie.r+5)){
			this.setState(this.gameStates.LOSE);
			break;
		}
	}	
	// Update baddie positions
	for (var i = 0; i < this.baddies.length; i++) {
		var baddie = this.baddies[i],
				path = baddie.path,
				dx = baddie.vx,
				dy = baddie.vy,
				x = path[0] += dx,
				y = path[1] += dy;
		// Wrap around the walls.
		if (x < 0-padx || x > 1+padx) path[0] = Math.abs(1 - x);
		if (y < 0-pady || y > 1+pady) path[1] = Math.abs(1 - y);
		if(this.isCollision({x:this.x(x),y:this.y(y)},{x:this.x(.5),y:this.y(.5)},baddie.r+5*Math.sqrt(2))){
			this.setState(this.gameStates.LOSE);
			break;
		}
	}	
	// Update baddie positions
	for (var i = 0; i < this.baddiesAvg.length; i++) {
		var baddie = this.baddiesAvg[i],
				path = baddie.path,
				dx = baddie.vx,
				dy = baddie.vy,
				x = path[0] += dx,
				y = path[1] += dy;
		// Wrap around the walls.
		if (x < 0-padx || x > 1+padx) path[0] = Math.abs(1 - x);
		if (y < 0-pady || y > 1+pady) path[1] = Math.abs(1 - y);
		if(this.isCollision({x:this.x(x),y:this.y(y)},{x:this.x(.5),y:this.y(.5)},baddie.r+5*Math.sqrt(2))){
			this.setState(this.gameStates.LOSE);
			break;
		}
	}
}

Asteroids.prototype.updateFiredShotsPositions = function() {
	// Update fired shots and detect collisions with baddies
	for (var i = 0; i < this.firedShots.length; i++) {
		var shot = this.firedShots[i],
				path = shot.path,
				dx = shot.vx,
				dy = shot.vy,
				x = path[0] += dx,
				y = path[1] += dy;

		// Remove when we get to a wall
		if (x < 0 || x > 1 || y < 0 || y > 1) {
			this.firedShots.splice(i,1);
			this.redraw();
			i--;
			continue;
		}
		
		var removed = false;
		// Collision detection
		for (var j = 0; j < this.baddiesBase.length; j++) {
			var baddie = this.baddiesBase[j],
					baddieX = baddie.path[0],
					baddieY = baddie.path[1];
			if(this.isCollision({x:this.x(x),y:this.y(y)},{x:this.x(baddieX),y:this.y(baddieY)},baddie.r+shot.r)){
				// Remove baddie and shot
				this.baddiesBase.splice(j,1);
				j--;
				this.firedShots.splice(i,1);
				i--;
				this.redraw();
				break;
			}
		}	
		if(removed) continue;
		// Collision detection
		for (var j = 0; j < this.baddies.length; j++) {
			var baddie = this.baddies[j],
					baddieX = baddie.path[0],
					baddieY = baddie.path[1];
			if(this.isCollision({x:this.x(x),y:this.y(y)},{x:this.x(baddieX),y:this.y(baddieY)},baddie.r+shot.r)){
				// Remove baddie and shot
				this.baddies.splice(j,1);
				j--;
				this.firedShots.splice(i,1);
				i--;
				this.redraw();
				break;
			}
		}	
		if(removed) continue;
		// Collision detection
		for (var j = 0; j < this.baddiesAvg.length; j++) {
			var baddie = this.baddiesAvg[j],
					baddieX = baddie.path[0],
					baddieY = baddie.path[1];
			if(this.isCollision({x:this.x(x),y:this.y(y)},{x:this.x(baddieX),y:this.y(baddieY)},baddie.r+shot.r)){
				// Remove baddie and shot
				this.baddiesAvg.splice(j,1);
				j--;
				this.firedShots.splice(i,1);
				i--;
				this.redraw();
				break;
			}
		}	
	}
}

Asteroids.prototype.update = function(container) {
  // Create a new SVG graphics element that fills our container.
  var graphics = new Graphics(container,'asteroidField');
  // Remember our container and graphics for redrawing things later.
  this.container = container;
  this.graphics = graphics;
  // Draw a background rectangle.
  graphics.graph.append('svg:rect')
    .attr('class','background')
    .attr('width',graphics.width)
    .attr('height',graphics.height);
  // Create scales to map positions from 'game space' to 'pixel space'
	this.x = d3.scale.linear()
		.domain([0,1])
		.range([0,graphics.width-1]);
	this.y = d3.scale.linear()
		.domain([0, 1])
		.range([0,graphics.height-1]);
		
	this.histy = d3.scale.linear()
		.domain([0,1])
		.range([graphics.height-1,.8*(graphics.height-1)]);	
	
	// 10 pixel pads around walls to make wrap around transitions look smooth
	this.padx = 10/this.graphics.width;
	this.pady = 10/this.graphics.height;
	// Draw our home
	var self = this;
	var homeRect = graphics.graph.selectAll('rect.home')
		.data([{path:[.5,.5],w:10,h:10}])
	.enter()
		.append('svg:rect')
		.attr('class','home');
	homeRect
		.attr("transform", function(d) { return "translate(" + (self.x(d.path[0]) - d.w/2) + ',' + (self.y(d.path[1]) - d.h/2) + ")"; })
		.attr("width", function(d) { return d.w; } )
		.attr("height", function(d) { return d.h; } );
					
	// Draw histogram
	graphics.graph.selectAll('rect.hist')
		.data(this.values)
	.enter().append('svg:rect')
		.attr('class','hist')
		.style('fill','#B5A58B')
		.attr('x', function(d,i) { return self.x(i/24) })
		.attr('y', function(d) { return self.histy(d) })
		.attr('width', self.x(1/24) )
		.attr('height', function(d) { return graphics.height - self.histy(d) });
		
	// Draw hour label
	graphics.graph.selectAll('text.hourLabel')
		.data([this.hourOffset])
	.enter().append('svg:text')
		.attr('class','hourLabel')
		.text(function(d) { 
			format = d3.time.format("%I %p");
			return format(new Date(2012, 1, 5, d-1));
			})
		.attr('x', function(d) { return self.x((d-1+.5)/24); })
		.attr('y', self.histy(0) - 1*graphics.fontSize)
		.style('opacity',0);
		
	// Listen for mouse click events
	graphics.graph.on("click", function(d) {
		if( self.currentState == self.gameStates.RUNNING ) {
			// Get mouse x,y coordinates relative to svg container
			var path = d3.mouse(this);
			// Calculate angle relative to origin at home
			var origin = [.5,.5];
			var theta = Math.atan2(path[1]/graphics.height - origin[1], path[0]/graphics.width - origin[0]);
			// Calculate velocity
			var speed = .01;
			var vx = speed*Math.cos(theta), vy = speed*Math.sin(theta);
			// Add shot to the list of shotsfired
			var shot = {path:origin, vx:vx, vy:vy, r:2};
			self.firedShots.push(shot);
		}
	});
	
	this.redraw();
  this.showMessage();
}

Asteroids.prototype.end = function() {
	this.setState(this.gameStates.PAUSE);
	d3.select(window).on("keydown", function() { return 0;} );
}

// Create some random baddies
Asteroids.prototype.createRandomBaddie = function() {
	var x = Math.random(), y = Math.random();
	var speed = .001;
	var theta = Math.random()*Math.PI*2;
  return {
    vx: speed*Math.cos(theta),
    vy: speed*Math.sin(theta),
    path: [x, y],
    r: 10
  };
}

// Create some random baddies
Asteroids.prototype.createRandomBaddieInPad = function() {
	var x = 0, y = 0;
	switch ( Math.floor(Math.random()*4) ) {
		case 0: x += Math.random(); break;
		case 1: y += Math.random(); break;
		case 2: x += Math.random(); y += 1; break;
		case 3: y += Math.random(); x += 1; break;
	}
	var speed = .001;
	var theta = Math.random()*Math.PI*2;
  return {
    vx: speed*Math.cos(theta),
    vy: speed*Math.sin(theta),
    path: [x, y],
    r: 10
  };
}

Asteroids.prototype.redraw = function() {
	var self = this;
	var graphics = this.graphics;
	// Update fired shots
	var shots = graphics.graph.selectAll('circle.shots')
		.data(this.firedShots);
	shots.enter().append('svg:circle')
		.attr('class','shots')
		.attr("r", function(d) { return d.r })
		.attr('fill','blue');
	shots
		.attr("transform", function(d) { return "translate(" + self.x(d.path[0]) + ',' + self.y(d.path[1]) + ")" });
	shots.exit()
		.remove();
	// Update baddies
	var baddies = graphics.graph.selectAll("ellipse.baddiesValue")
		.data(this.baddies);
	baddies.enter().append("svg:ellipse")
		.attr('class','baddiesValue')
		.attr('id','value')
    .attr("rx", function(d) { return d.r*1.25 })
    .attr("ry", function(d) { return d.r*0.75 })
    .style('fill-opacity', 0)
  .transition()
  	.duration(1000)
  	.style('fill-opacity', .75);
  baddies.attr("transform", function(d) {
    return "translate(" + self.x(d.path[0]) + ',' + self.y(d.path[1]) + ")rotate(" + Math.atan2(self.y(d.vy), self.x(d.vx)) * self.degrees + ")";
  });
	baddies.exit()
		.remove();
	// Update baddies
	var baddiesBase = graphics.graph.selectAll("ellipse.baddiesBase")
		.data(this.baddiesBase);
	baddiesBase.enter().append("svg:ellipse")
		.attr('class','baddiesBase')
		.attr('id','base')
    .attr("rx", function(d) { return d.r*1.25 })
    .attr("ry", function(d) { return d.r*0.75 })
    .style('fill-opacity', 0)
  .transition()
  	.duration(1000)
  	.style('fill-opacity', .75);
  baddiesBase.attr("transform", function(d) {
    return "translate(" + self.x(d.path[0]) + ',' + self.y(d.path[1]) + ")rotate(" + Math.atan2(self.y(d.vy), self.x(d.vx)) * self.degrees + ")";
  });
	baddiesBase.exit()
		.remove();	
	// Update baddies
	var baddiesAvg = graphics.graph.selectAll("ellipse.baddiesAvg")
		.data(this.baddiesAvg);
	baddiesAvg.enter().append("svg:ellipse")
		.attr('class','baddiesAvg')
		.attr('id','avg')
    .attr("rx", function(d) { return d.r*1.25 })
    .attr("ry", function(d) { return d.r*0.75 })
    .style('fill-opacity', 0)
  .transition()
  	.duration(1000)
  	.style('fill-opacity', .75);
  baddiesAvg.attr("transform", function(d) {
    return "translate(" + self.x(d.path[0]) + ',' + self.y(d.path[1]) + ")rotate(" + Math.atan2(self.y(d.vy), self.x(d.vx)) * self.degrees + ")";
  });
	baddiesAvg.exit()
		.remove();	
	
	// Highlight active hour
	graphics.graph.selectAll('rect.hist')
		.style('fill', function(d,i) {
			if(i+1 == self.hourOffset){
				return 'red';
			}
			else if (i + 1 < self.hourOffset){
				return 'darkred';
			}
			else {
				return '#B5A58B';
			}
		});
};

// Returns true if point and pos are within a distrance r of each other
Asteroids.prototype.isCollision = function(point,pos,r) {
	var dx = point.x - pos.x;
	var dy = point.y - pos.y;
	var dist = Math.sqrt(dx * dx + dy * dy);
	if( dist <= r ){
		return true;
	}
	return false;
};

// Fetches and analyzes the data corresponding to this.dayOffset
Asteroids.prototype.getData = function() {
  // Fetch the data from our source.
  this.displayData = this.dataSource.getDays(this.dayOffset-1,this.dayOffset,this.displayRange);
  // Find the minimum reading.
  var size = this.displayData.length;
  log(size);
  var minValue = this.dataSource.maxValue;
  for(var i = 0; i < size; ++i) {
    var value = this.displayData[i];
    if(value < minValue) minValue = value;
  }
  var maxValue = minValue;
  for(var i = 0; i < size; ++i) {
  	var value = this.displayData[i];
  	if(value > maxValue) maxValue = value;
  }
  this.minValue = minValue;
  this.baseValue = minValue / maxValue;

  if(this.values == null) {
    this.values = new Array(size);
    this.avgValues = new Array(24);
  }
  for(var i = 0; i < size; ++i) {
    this.values[i] = this.displayData[i]/maxValue;
  }
  for(var i = 0; i < 24; ++i) {
    var hourAvg = this.dataSource.averageByHour(i);
    hourAvg = minValue + 0.5*(hourAvg - minValue);
    hourAvg = Math.max(hourAvg,minValue);
    this.avgValues[i] = hourAvg/maxValue;
  }
}

Asteroids.prototype.setState = function(newState) {
	var self = this;
	var oldState = this.state;
	this.currentState = newState;
		
	if(newState == this.gameStates.RUNNING && oldState != this.gameStates.RUNNING) {
		// playing game
		this.toggleTimers();
		this.positionLoop();
		// hide all messages
		this.messagesVisible = false;
		this.currentMessage = ['Playing!'];
		this.showMessage();
	}
	else if(newState == this.gameStates.PAUSE){
		// pause game
		this.toggleTimers();
		// display pause message
		this.messagesVisible = true;
		this.currentMessage = ['Tap to resume.'];
		this.showMessage();
	}
	else if(newState == this.gameStates.READY){
		// init game
		this.initNewGame();
		if(this.messageCount == null) {
			this.setState(this.gameStates.INTRO);
		}
		else {
			this.messagesVisible = true;
			this.showMessage();
		}
	}
	else if(newState == this.gameStates.LOSE){
		this.currentMessage = ['Use less energy tomorrow for a higher score!'];
		this.messagesVisible = true;
		this.showMessage();
	}
	else if(newState == this.gameStates.INTRO) {
		log('set state to intro');
		this.messageCount = 0;
		this.getNextMessage();
		this.messagesVisible = true;
	}
}

Asteroids.prototype.initNewGame = function(){
	this.dayOffset = 0;
	this.initNewRound();
	this.currentMessage = ['New Game!','Tap to start!'];
}

Asteroids.prototype.initNewRound = function() {
	this.lastSpawn = this.spawnDelay;
	this.hourOffset = 0;
	this.firedShots = [];
	this.baddies = [];
	this.baddiesAvg = [];
	this.baddiesBase = [];
	this.messagesVisible = true;
	this.currentMessage = ['Next Day!','Tap to start!']
}

Asteroids.prototype.spawn = function() {
	// Calculate number of baddies to spawn for this hour interval
	this.numBaddies = Math.floor(this.maxBaddies*this.values[this.hourOffset]+.5);
	this.numBaddies = this.numBaddies*this.numBaddies;
	this.numBaddiesAvg = Math.floor(this.maxBaddies*this.avgValues[this.hourOffset]+.5);
	this.numBaddiesBase = Math.floor(this.maxBaddies*this.baseValue+.5);
	// Append wave of new baddies
	this.baddies = $.merge(this.baddies,d3.range(this.numBaddies).map(this.createRandomBaddieInPad));
	this.baddiesAvg = $.merge(this.baddiesAvg,d3.range(this.numBaddiesAvg).map(this.createRandomBaddieInPad));
	this.baddiesBase = $.merge(this.baddiesBase,d3.range(this.numBaddiesBase).map(this.createRandomBaddieInPad));
}

Asteroids.prototype.showMessage = function() {
	log(this.currentMessage);
  var message = this.graphics.showMessage(this.currentMessage,0);
  if(!this.messagesVisible) this.graphics.setMessageOpacity(0);
  var self = this;
  message.on('click',function() {
		if(self.currentState == self.gameStates.PAUSE) {
			// Resume game
			self.setState(self.gameStates.RUNNING);
		}
		else if (self.currentState == self.gameStates.READY) {
			// Start game
			self.setState(self.gameStates.RUNNING);
		}
		else if (self.currentState == self.gameStates.LOSE) {
			// Set up a new game
			self.setState(self.gameStates.READY);
		}
		else if (self.currentState == self.gameStates.INTRO) {
			// Cycle through intro messages
			if(self.messageCount == self.messageLimit) {
				self.setState(self.gameStates.RUNNING);
			}
			else {
				self.getNextMessage();
				self.showMessage();
			}
		}
  });
  // Show the current callout.
  //this.graphics.clearCallouts();
  //var call = this.currentCallout;
  //if(call) {
  //  this.graphics.addCallout(this.xScale(call.x),this.yScale(call.y),call.url);
  //}
}

Asteroids.prototype.getNextMessage = function() {
  var msg,call=null;
  switch(++this.messageCount) {
  case 1:
    msg = ['Try to survive the day!','Don\'t let your energy use','overwhelm your home!'];
    break;
  case 2:
    msg = ['The number of enemies that','spawn every "hour" is determined','by yesterday\'s electricity use.'];
    break;
  case 3:
    msg = ['The number of blue enemies is','determined by your base load.'];
    //call = { x:hr, y:this.getConsumption(hr) };
    break;
  case 4:
    msg = ['Your average energy use is','represented by green enemies.' ];
    break;
  case 5:
    msg = ['The dark enemies reflect', 'yesterday\'s actual energy use.'];
    break;
  case 6:
  	msg = ['Touch to start!'];
  	break;
  default:
    msg = [''];
  }
  this.currentMessage = msg;
  if(call && !('url' in call)) call.url = null;
  this.currentCallout = call;
}
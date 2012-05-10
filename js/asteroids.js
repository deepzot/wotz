function Asteroids() {
	this.id = 'asteroids';
	this.label = 'Asteroids';
	this.degrees = 180 / Math.PI;
	this.x = null;
	this.y = null;
	this.firedShots = null;
	this.randomBaddies = null;
	this.nBaddies = 20;
	this.interval = null;
	// Data
	this.dayOffset = null;
	this.hourOffset = null;
	this.dataSource = null;
  this.displayData = null;
  this.displayRange = [ null,null ];
  this.currentState = null;
}

Asteroids.prototype.gameStates = {
  PAUSE : {value: 0, name: "Pause"}, 
  READY: {value: 1, name: "Ready"}, 
  RUNNING : {value: 2, name: "Running"},
  LOSE : {value: 3, name: "Lose"}
};

Asteroids.prototype.start = function(data) { 
	var self = this;
	this.dataSource = data;
	this.dayOffset = 0;
	this.baddies = null;
	this.getData();
	
	if( this.currentState == null) {
		this.setState(this.gameStates.READY);
	}
	this.setState(this.gameStates.RUNNING);
	
	this.firedShots = []
	this.randomBaddies = d3.range(Math.floor(this.nBaddies*this.baddiesBase+.5)).map(this.createRandomBaddie);

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
		
		// Check time
		var d = new Date();
		var time = d.getTime();
		if (time - self.lastSpawn > self.spawnDelay) {
			self.spawn();
			self.lastSpawn = time;
		}
		// Update svg elements
		self.redraw();

	});
}

Asteroids.prototype.toggleTimers = function() {
	var d = new Date();
	var time = d.getTime();
	this.lastSpawn = time - this.lastSpawn;
}

Asteroids.prototype.updateBaddiePositions = function() {
	// Wall pads
	var padx = 10/this.graphics.width;
	var pady = 10/this.graphics.height;
	// Update baddie positions
	for (var i = 0; i < this.randomBaddies.length; i++) {
		var baddie = this.randomBaddies[i],
				path = baddie.path,
				dx = baddie.vx,
				dy = baddie.vy,
				x = path[0] += dx,
				y = path[1] += dy;
		// Wrap around the walls.
		if (x < 0-padx || x > 1+padx) path[0] = Math.abs(1 - x);
		if (y < 0-pady || y > 1+pady) path[1] = Math.abs(1 - y);
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
			i--;
			continue;
		}
		
		// Collision detection
		for (var j = 0; j < this.randomBaddies.length; j++) {
			var randomBaddie = this.randomBaddies[j],
					baddieX = randomBaddie.path[0],
					baddieY = randomBaddie.path[1];
			if(this.isCollision({x:this.x(x),y:this.y(y)},{x:this.x(baddieX),y:this.y(baddieY)},randomBaddie.r+shot.r)){
				// Remove baddie and shot
				this.randomBaddies.splice(j,1);
				j--;
				this.firedShots.splice(i,1);
				i--;
				this.randomBaddies.push(this.createRandomBaddie());
				continue;
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
  graphics.graph
  	.style('background', 'gray');
  // Create scales to map positions from 'game space' to 'pixel space'
	this.x = d3.scale.linear()
		.domain([0,1])
		.range([0,graphics.width-1]);
	this.y = d3.scale.linear()
		.domain([0, 1])
		.range([0,graphics.height-1]);
	// Draw our home
	var self = this;
	var homeRect = graphics.graph.selectAll('rect')
			.data([{path:[.5,.5],w:10,h:10}])
		.enter()
			.append('svg:rect');
	homeRect
			.attr("transform", function(d) { return "translate(" + (self.x(d.path[0]) - d.w/2) + ',' + (self.y(d.path[1]) - d.h/2) + ")"; })
			.attr("width", function(d) { return d.w; } )
			.attr("height", function(d) { return d.h; } )
			.attr("fill","yellow");
			
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
}

Asteroids.prototype.end = function() {

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

Asteroids.prototype.redraw = function() {
	var self = this;
	var graphics = this.graphics;
	// Update baddies
	var baddies = graphics.graph.selectAll("ellipse.baddies")
		.data(this.randomBaddies);
	baddies.enter().append("svg:ellipse")
		.attr('class','baddies')
    .attr("rx", function(d) { return d.r*1.25 })
    .attr("ry", function(d) { return d.r*0.75 })
    .style('fill','white');
  baddies.attr("transform", function(d) {
    return "translate(" + self.x(d.path[0]) + ',' + self.y(d.path[1]) + ")rotate(" + Math.atan2(self.y(d.vy), self.x(d.vx)) * self.degrees + ")";
  });
	baddies.exit()
		.remove();	
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
  this.baddiesBase = minValue / maxValue;

  if(this.baddies == null) {
    this.baddies = new Array(size);
    this.baddiesAvg = new Array(24);
  }
  for(var i = 0; i < size; ++i) {
    this.baddies[i] = this.displayData[i]/maxValue;
  }
  for(var i = 0; i < 24; ++i) {
    var hourAvg = this.dataSource.averageByHour(i);
    hourAvg = minValue + 0.5*(hourAvg - minValue);
    hourAvg = Math.max(hourAvg,minValue);
    this.baddiesAvg[i] = hourAvg/maxValue;
  }
  log(this.baddiesBase);
  log(this.baddies);
  log(this.baddiesAvg);
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
		//this.currentMessage = ['Playing...'];
		//this.hideMessage();
	}
	else if(newState == this.gameStates.PAUSE){
		// pause game
		this.toggleTimers();
		// display pause message
		//this.currentMessage = ['Touch to resume...'];
		//this.showMessage();
	}
	else if(newState == this.gameStates.READY){
		// init game
		this.initNewGame();
		// display ready to start message
	}
	else if(newState == this.gameStates.LOSE){
		// end game
		//clearInterval(this.intervalID);
		// display game over message
		//this.currentMessage = ['Game over!','Touch to play again...'];
		//this.showMessage();
	}
}

Asteroids.prototype.initNewGame = function(){
	this.spawnDelay = 5000;
	this.lastSpawn = 0;
}

Asteroids.prototype.spawn = function() {
	this.randomBaddies.push(this.createRandomBaddie());
}

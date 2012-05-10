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
}

Asteroids.prototype.start = function(data) { 
	var self = this;
	this.dataSource = data;
	this.dayOffset = 0;
	this.baddies = null;
	this.getData();
	
	this.firedShots = []
	this.randomBaddies = d3.range(Math.floor(this.nBaddies*this.baddiesBase+.5)).map(this.createRandomBaddie);
	// The heartbeat
	d3.timer(function() {
		// Update baddie positions
		for (var i = 0; i < self.randomBaddies.length; i++) {
			var randomBaddie = self.randomBaddies[i],
					path = randomBaddie.path,
					dx = randomBaddie.vx,
					dy = randomBaddie.vy,
					x = path[0] += dx,
					y = path[1] += dy;
	
			// Wrap around the walls.
			if (x < 0 || x > 1) path[0] = Math.abs(1 - x);
			if (y < 0 || y > 1) path[1] = Math.abs(1 - y);
		}
		// Update fired shots and detect collisions with baddies
		for (var i = 0; i < self.firedShots.length; i++) {
			var shot = self.firedShots[i],
					path = shot.path,
					dx = shot.vx,
					dy = shot.vy,
					x = path[0] += dx,
					y = path[1] += dy;
	
			// Remove when we get to a wall
			if (x < 0 || x > 1 || y < 0 || y > 1) {
				self.firedShots.splice(i,1); 
				i--; 
				continue;
			}
			
			// Collision detection
			for (var j = 0; j < self.randomBaddies.length; j++) {
				var randomBaddie = self.randomBaddies[j],
						baddieX = randomBaddie.path[0],
						baddieY = randomBaddie.path[1];
				// *** hardcoded baddieRadius+shotRadius ** FIXME
				if(self.isCollision({x:self.x(x),y:self.y(y)},{x:self.x(baddieX),y:self.y(baddieY)},randomBaddie.r+shot.r)){
					// Remove baddie and shot
					self.randomBaddies.splice(j,1);
					j--;
					self.firedShots.splice(i,1);
					i--;
					self.randomBaddies.push(self.createRandomBaddie());
					continue;
				}
			}	
		}
		// Update svg elements
		self.redraw();
	});
	// Listen for keydown events
	d3.select(window).on("keydown", function() {
			var keyCode = d3.event.keyCode;
			if(keyCode == 32) {
				self.randomBaddies.push(self.createRandomBaddie());
			}
	});
}

Asteroids.prototype.update = function(container) {
  var svg = d3.select('#moduleContent').append("svg:svg")
    .attr('class','graphics')
    .attr('id', 'asteroidField')
    .style('background','gray');
  var width = $('#asteroidField').width(), height = $('#asteroidField').height();
  //svg.attr('width',width).attr('height',height);
  
	this.x = d3.scale.linear()
		.domain([0,1])
		.range([0,width-1]);
	this.y = d3.scale.linear()
		.domain([0, 1])
		.range([0,height-1]);
		
	// Draw boarders, background stuff
	var self = this;

	// Draw our home
	var homeRect = svg.selectAll('rect')
			.data([{path:[.5,.5],w:10,h:10}])
		.enter()
			.append('svg:rect');
	homeRect
			.attr("transform", function(d) { return "translate(" + (self.x(d.path[0]) - d.w/2) + ',' + (self.y(d.path[1]) - d.h/2) + ")"; })
			.attr("width", function(d) { return d.w; } )
			.attr("height", function(d) { return d.h; } )
			.attr("fill","yellow");
			
	// Listen for mouse click events
	svg.on("click", function(d) {
		// Get mouse x,y coordinates relative to svg container
		var path = d3.mouse(this);
		// Calculate angle relative to origin at home
		var origin = [.5,.5];
		var theta = Math.atan2(path[1]/height - origin[1], path[0]/width - origin[0]);
		// Calculate velocity
		var speed = .01;
		var vx = speed*Math.cos(theta), vy = speed*Math.sin(theta);
		// Add shot to the list of shotsfired
		var shot = {path:origin, vx:vx, vy:vy, r:2};
		self.firedShots.push(shot);
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
	var svg = d3.select('#asteroidField');
	// Update baddies
	var baddies = svg.selectAll("ellipse.baddies")
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
	var shots = svg.selectAll('circle.shots')
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

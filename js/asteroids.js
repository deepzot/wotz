function Asteroids() {
	this.nBaddies = 10;
	this.degrees = 180 / Math.PI;
	this.x = null;
	this.y = null;
	// Create Fired shots array and svg group
	this.firedShots = [];
	this.svg = null;
	this.randomBaddies = null;
}

Asteroids.prototype.start = function(data) { 
	var self = this;
	this.randomBaddies = d3.range(this.nBaddies).map(this.createRandomBaddie);
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
			if (x < 0 || x > 1) {self.firedShots.splice(i,1); i--; continue;}
			if (y < 0 || y > 1) {self.firedShots.splice(i,1); i--; continue;}
			
			// Collision detection
			for (var j = 0; j < self.randomBaddies.length; j++) {
				var randomBaddie = self.randomBaddies[j],
						baddieX = randomBaddie.path[0],
						baddieY = randomBaddie.path[1];
				// *** hardcoded baddieRadius+shotRadius ** FIXME
				if(self.isCollision({x:x,y:y},{x:baddieX,y:baddieY},randomBaddie.r+shot.r)){
					// Remove baddie and shot
					self.randomBaddies.splice(j,1);
					j--;
					self.firedShots.splice(i,1);
					i--;
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
  this.svg = d3.select('#moduleContent').append("svg:svg")
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
	var homeRect = this.svg.selectAll('rect')
			.data([{path:[.5,.5],w:.02,h:.02}])
		.enter()
			.append('svg:rect');
	homeRect
			.attr("transform", function(d) { return "translate(" + self.x(d.path[0] - d.w/2) + ',' + self.y(d.path[1] - d.h/2) + ")"; })
			.attr("width", function(d) { return self.x(d.w); } )
			.attr("height", function(d) { return self.y(d.h); } )
			.attr("fill","yellow");
			
	// Listen for mouse click events
	this.svg.on("click", function(d) {
		// Get mouse x,y coordinates relative to svg container
		var path = d3.mouse(this);
		// Calculate angle relative to origin at home
		var origin = [.5,.5];
		var theta = Math.atan2(path[1]/height - origin[1], path[0]/width - origin[0]);
		// Calculate velocity
		var speed = .01;
		var vx = speed*Math.cos(theta), vy = speed*Math.sin(theta);
		// Add shot to the list of shotsfired
		var shot = {path:origin, vx:vx, vy:vy, r:.005};
		self.firedShots.push(shot);
	});
}

Asteroids.prototype.end = function() {

}

// Create some random baddies
Asteroids.prototype.createRandomBaddie = function() {
	var x = Math.random(), y = Math.random();
  return {
    vx: (Math.random()*2 - 1)/100/4,
    vy: (Math.random()*2 - 1)/100/4,
    path: [x, y],
    r: .008
  };
}

Asteroids.prototype.redraw = function() {
	var self = this;
	// Update baddies
	var baddies = this.svg.selectAll("ellipse.baddies")
		.data(this.randomBaddies);
	baddies.enter().append("svg:ellipse")
		.attr('class','baddies')
    .attr("rx", function(d) { return self.x(d.r*1.25) })
    .attr("ry", function(d) { return self.x(d.r*0.75) })
    .style('fill','white');
  baddies.attr("transform", function(d) {
    return "translate(" + self.x(d.path[0]) + ',' + self.y(d.path[1]) + ")rotate(" + Math.atan2(d.vy, d.vx) * self.degrees + ")";
  });
	baddies.exit()
		.remove();	
	// Update fired shots
	var shots = this.svg.selectAll('circle.shots')
		.data(this.firedShots);
	shots.enter().append('svg:circle')
		.attr('class','shots')
		.attr("r", function(d) { return self.x(d.r) })
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
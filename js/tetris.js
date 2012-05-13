function Tetris() {
  this.id = 'tetris';
  this.label = 'Tetris';
  this.currentState = null;
  this.score = null;
  this.level = null;
  this.rowCount = null;
  this.storedTiles = null;
  this.numTilesX = 10;
  this.numTilesY = 15;
  this.rowsPerLevel = 3;
  this.stepDelay = null;
  this.x = null;
  this.y = null;
	this.intervalID = null;
	this.currentMessage = null;
}

Tetris.prototype.gameStates = {
  	PAUSE : {value: 0, name: "Pause"}, 
  	READY: {value: 1, name: "Ready"}, 
  	RUNNING : {value: 2, name: "Running"},
  	LOSE : {value: 3, name: "Lose"}
	};

Tetris.prototype.start = function(data) {
  if(this.currentState == null) {
  	this.initNewGame();
  	this.setState(this.gameStates.READY);
  }
  else {
  	this.drawActivePiece();
  	this.drawTiles();
  }
	log("Hello from Tetris!");
  var self = this;
	// Listen for keydown events
	d3.select(window).on("keydown", function() {
		var keyCode = d3.event.keyCode;
		// Up Arrow
		if (keyCode == 38) {
			if(self.currentState == self.gameStates.RUNNING) {
				// Rotate shape 
				newShape = Shape.rotateLeft();
				if(self.isPossibleMovement(0,0,newShape)) {
					Shape.State.currentShape = newShape;
					self.drawActivePiece();
				}
			}
		}
		// Left Arrow
		else if(keyCode == 37) {
			if(self.currentState == self.gameStates.RUNNING) {
				if(self.isPossibleMovement(-1,0,Shape.State.currentShape)) {
					Shape.State.x = Shape.State.x - 1;
					self.drawActivePiece();
				}
			}
		}
		// Right Arrow
		else if(keyCode == 39) {
			if(self.currentState == self.gameStates.RUNNING) {
				if(self.isPossibleMovement(1,0,Shape.State.currentShape)) {
					Shape.State.x = Shape.State.x + 1;
					self.drawActivePiece();
				}
			}
		}
		// Down Arrow
		else if(keyCode == 40) {
			if(self.currentState == self.gameStates.RUNNING) {
				if(self.isPossibleMovement(0,1,Shape.State.currentShape)) {
					Shape.State.y = Shape.State.y + 1;
					self.drawActivePiece();
				}
			}
		}
		// Space bar
		else if(keyCode == 32) {
			if(self.currentState == self.gameStates.RUNNING) {
				// Pause game
				self.setState(self.gameStates.PAUSE);
			}
			else if(self.currentState == self.gameStates.PAUSE) {
				// Resume game
				self.setState(self.gameStates.RUNNING);
			}
			else if (self.currentState == self.gameStates.READY) {
				// Start a new game
				self.setState(self.gameStates.RUNNING);
			}
			else if (self.currentState == self.gameStates.LOSE) {
				// Set up new game
				self.initNewGame();
				self.setState(self.gameStates.READY);
			}
		}
		return;
	}); // End Listen for key down events
	
}

Tetris.prototype.update = function(container) {
	var self = this;
  // Create a new SVG graphics element that fills our container.
  var graphics = new Graphics(container,'tetrisField');
  // Remember our container and graphics for redrawing things later.
  this.container = container;
  this.graphics = graphics;
  graphics.graph
  	.style('background', 'lightblue');
  var width = graphics.width, height = graphics.height;
  // Prepare tile scaling functions
  var padX = Math.floor(0.2*width);
  var effectiveWidth = width-2*padX;
  var effectiveHeight = height;
  var tileSize = Math.min(height/this.numTilesY,width/this.numTilesX);
  var padX = (width-tileSize*this.numTilesX)/2;
  var padY = (height-tileSize*this.numTilesY)/2;
  
	self.x = d3.scale.linear()
		.domain([0,this.numTilesX])
		.range([padX,width-1-padX]);
	self.y = d3.scale.linear()
		.domain([0, this.numTilesY])
		.range([padY,height-1-padY]);
	// Draw multiple horizontal lines
	for (var i=0; i <= this.numTilesY; i++) {
			graphics.graph.append("svg:line")
					.attr("x1", self.x(0))
					.attr("y1", self.y(i))
					.attr("x2", self.x(self.numTilesX))
					.attr("y2", self.y(i))
					.style("stroke", "rgb(6,120,155)")
	};
	// Using for loop to draw multiple vertical lines
	for (var i=0; i <= self.numTilesX; i++) {
			graphics.graph.append("svg:line")
					.attr("x1", self.x(i))
					.attr("y1", self.y(0))
					.attr("x2", self.x(i))
					.attr("y2", self.y(self.numTilesY))
					.style("stroke", "rgb(6,120,155)")
	};
  // Add score label.
  var scoreLabel = graphics.graph.selectAll('text.scoreLabel').data([this.score]);
  scoreLabel.enter().append('svg:text')
    .attr('class','scoreLabel')
    .text(function(d) { return 'Score: ' + d; })
    .attr('x', padX/2)
    .attr('y', padY + 3*graphics.fontSize);
  // Add level label.
  var levelLabel = graphics.graph.selectAll('text.levelLabel').data([this.level]);
  levelLabel.enter().append('svg:text')
    .attr('class','levelLabel')
    .text(function(d) { return 'Level: ' + d; })
    .attr('x', width-1-padX/2)
    .attr('y', padY + 3*graphics.fontSize);
  // Add row count label.
//   var rowCountLabel = graphics.graph.selectAll('text.rowCountLabel').data([this.rowCount]);
//   rowCountLabel.enter().append('svg:text')
//     .attr('class','rowCountLabel')
//     .text(function(d) { return 'Rows Cleared: ' + d; })
//     .attr('x', padX/2)
//     .attr('y', padY + 7*graphics.fontSize); 
    
	this.showMessage();
}

Tetris.prototype.end = function() {
	this.setState(this.gameStates.PAUSE);
	//clearInterval(this.intervalID); 
}

Tetris.prototype.initNewGame = function() {
	this.currentState = this.gameStates.READY;
	this.storedTiles = []; // initTiles(recent);
	this.score = 0;
	this.stepDelay = 1000; // in milliseconds
	Shape.init(Math.floor(this.numTilesX/2),-1,Shape.randomShape());
	this.level = 1;
	this.rowCount = 0;
	this.currentMessage = ['Touch to play!'];
}

// Our active shape
var Shape = {
	State: {
		x : null,
		y : null,
		currentShape : null
	},
	// Character repr of possible shapes
	shapeList: ['T','L','J','S','Z','I','O'],
	// x,y specified in board space	
	// shape is an array of 4 tiles 
	init: function(x, y, shape) {
		this.State.x = x;
		this.State.y = y;
		this.State.currentShape = shape;
	},
	// the parameter shape is a single character from 
	// the set: ['T','L','J','S','Z','I','O']
	getShape: function(shape) {
		switch(shape) {
			case 'T':
				return [
					{ x:-1, y: 0 },
					{ x: 0, y: 0 },
					{ x: 0, y: 1 },
					{ x: 1, y: 0 }
				];
			case 'L':
				return [
					{ x:-1, y: 0 },
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
					{ x: 1, y:-1 }
				];
			case 'J':
				return [
					{ x:-1, y:-1 },
					{ x:-1, y: 0 },
					{ x: 0, y: 0 },
					{ x: 1, y: 0 }
				];
			case 'S':
				return [
					{ x:-1, y: 0 },
					{ x: 0, y: 0 },
					{ x: 0, y:-1 },
					{ x: 1, y:-1 }
				];
			case 'Z':
				return [
					{ x:-1, y:-1 },
					{ x: 0, y:-1 },
					{ x: 0, y: 0 },
					{ x: 1, y: 0 }
				];
			case 'I':
				return [
					{ x: 0, y:-2 },
					{ x: 0, y:-1 },
					{ x: 0, y: 0 },
					{ x: 0, y: 1 }
				];
			case 'O':
				return [
					{ x: 0, y: 0 },
					{ x: 0, y:-1 },
					{ x: 1, y:-1 },
					{ x: 1, y: 0 }
				];
			default:
		}
	},
	// Returns a randomly selected shape.
	randomShape: function() {
		return this.getShape(this.shapeList[Math.floor(Math.random() * this.shapeList.length)])
	},
	// Returns a 90 degree ccw rotation of the current shape
  rotateLeft: function() {
  	newShape = []
  	for(var i=0; i < this.State.currentShape.length; i++) {
  		newShape[i] = { x:this.State.currentShape[i].y*-1, y:this.State.currentShape[i].x }
  	}
  	return newShape;
  } 
};

// Create a new piece
Tetris.prototype.createNewPiece = function() {
	Shape.State.y = -1;
	Shape.State.x = Math.floor(this.numTilesX/2);
	Shape.State.currentShape = Shape.randomShape();
}

// Collision detection
Tetris.prototype.isPossibleMovement = function(x, y, shape) {
	// Iterate through shape tiles
	for(var i = 0; i < shape.length; i++) {
		// Check collision with walls.
		if(x + shape[i].x + Shape.State.x < 0) {
			return false;
		}
		else if(x + shape[i].x + Shape.State.x > this.numTilesX-1) {
			return false;
		}
		// Don't worry about the top of the game board
		//else if(y + shape[i].y + Shape.State.y < 0) {
		//	return false;
		//}
		else if(y + shape[i].y + Shape.State.y > this.numTilesY-1 ){
			return false;
		}
	// Check for collision with stored tiles.
	for(var j = 0; j < this.storedTiles.length; j++) {
			if( this.storedTiles[j].x == x + shape[i].x + Shape.State.x 
			&& this.storedTiles[j].y == y + shape[i].y + Shape.State.y) {
				return false;
			}
		}
	}
	return true;
}
	
// Draw stuff
Tetris.prototype.drawActivePiece = function() {
	var self = this;
	var graphics = this.graphics;
	// Update active piece.
	var activePiece = graphics.graph.selectAll('rect')
		.data(Shape.State.currentShape);
	activePiece.enter().append("rect")
		.attr("width", this.x(1)-this.x(0))
		.attr("height", this.y(1)-this.y(0))
		.style("fill", "green");
	activePiece
	//.transition().duration(this.stepDelay/4)
		.attr("x", function(d,i) { return self.x(Shape.State.x + d.x) } )
		.attr("y", function(d,i) { return self.y(Shape.State.y + d.y) } );
	activePiece.exit().remove();
}

// Draw stuff
Tetris.prototype.drawTiles = function() {
	var self = this;
	var graphics = this.graphics;
	// Update stored tiles
	var tiles = graphics.graph.selectAll("ellipse")
		.data(this.storedTiles);
	// Append new tiles
	tiles.enter().append("ellipse")
		.attr("rx", this.x(.5)-this.x(0))
		.attr("ry", this.y(.5)-this.y(0))
		.style("stroke", "black")
		.style("fill", "blue");
	// Set attr for all tiles
	tiles
		.attr("cx", function(d) { return self.x(d.x + .5); })
		.attr("cy", function(d) { return self.y(d.y + .5); });
	// Remove cleared tiles
	tiles.exit().remove();
}

// Move active piece down or add it to the stored tiles	
Tetris.prototype.step = function() {
	var self = this;
	var graphics = this.graphics;
	
	// Check if we can move active piece down
	if(this.isPossibleMovement(0,1,Shape.State.currentShape)) {
		Shape.State.y = Shape.State.y + 1;
	}
	else {
		// Add tiles to stored tiles
		Shape.State.currentShape.forEach( function(p){
			self.storedTiles.push({x: Shape.State.x + p.x, y: Shape.State.y + p.y});
			// Check tiles are in top row
			if( Shape.State.y + p.y == 0 ){
				self.setState(self.gameStates.LOSE);
			}
		});
		// Clear filled rows	
		var numClearedRows = this.deletePossibleRows();
		this.rowCount += numClearedRows;
		
		if(this.rowCount >= this.rowsPerLevel*this.level) {
			this.level++;
			this.stepDelay = Math.floor(this.stepDelay * 0.9);
			clearInterval(this.intervalID);
			this.intervalID = setInterval(function() { self.step(); },this.stepDelay);
		}
		
		this.score += 10 * numClearedRows;
		this.score++;
		var scoreLabel = graphics.graph.selectAll('text.scoreLabel')
			.data([this.score])
			.text(function(d) { return 'Score: ' + d; });
		var levelLabel = graphics.graph.selectAll('text.levelLabel')
			.data([this.level])
			.text(function(d) { return 'Level: ' + d; });
// 		var rowCountLabel = graphics.graphselectAll('text.rowCountLabel')
// 			.data([this.rowCount])
// 			.text(function(d) { return 'Rows Cleared: ' + d; });
		//scoreLabel.exit().remove();

		// Create a new piece
		this.createNewPiece();
	}
	
	this.drawActivePiece();
	this.drawTiles();
		
}

// Iterates through each row and returns the number
// of filled rows that are removed
Tetris.prototype.deletePossibleRows = function(){
	self = this;
	var rowsDeleted = 0;
	for(var j = 0; j < this.numTilesY; j++){
		if( this.numTilesX == this.storedTiles.filter(function(d) {
			return (d.y == j);
		}).length) {
			self.deleteRow(j);
			rowsDeleted++;
		}
	}
	return rowsDeleted;
}

// Removes the tiles in the specified row and shifts 
// all the tiles above down one row.
Tetris.prototype.deleteRow = function(y) {
	// Get a list of tiles that does not include any 
	// from the specified row.
	this.storedTiles = this.storedTiles.filter(function(d) {
		return (d.y != y);
	});
	// Shift tiles that are above the specfied row down by one
	for(var i = 0; i < this.storedTiles.length; i++){
		if( this.storedTiles[i].y < y) {
			this.storedTiles[i].y = this.storedTiles[i].y + 1;
		}	
	};
}

Tetris.prototype.setState = function(newState) {
	var self = this;
	var oldState = this.currentState;
	this.currentState = newState;
		
	if(newState == this.gameStates.RUNNING && oldState != this.gameStates.RUNNING) {
		// playing game
		this.intervalID = setInterval(function() { self.step(); },this.stepDelay);
		// hide all messages
		this.currentMessage = ['Playing...'];
		this.messagesVisible = false;
		this.showMessage();
	}
	else if(newState == this.gameStates.PAUSE){
		// pause game
		clearInterval(this.intervalID);
		// display pause message
		this.messagesVisible = true;
		this.currentMessage = ['Touch to resume...'];
		this.showMessage();
	}
	else if(newState == this.gameStates.READY){
		// init game
		this.initNewGame();
		// display ready to start message
		this.messagesVisible = true;
		//this.showMessage();
	}
	else if(newState == this.gameStates.LOSE){
		// end game
		clearInterval(this.intervalID);
		// display game over message
		this.messagesVisible = true;
		this.currentMessage = ['Game over!','Touch to play again...'];
		this.showMessage();
	}
	return;
}

Tetris.prototype.showMessage = function() {
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
  });
}
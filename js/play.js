// These are all the variables we need to track
// the game
var mode;
var storedTiles;
var score;
var timer;
var stepDelay;
var HEIGHT = 15, WIDTH = 12;
var ROWSPERLEVEL = 10;
var x, y;
var gameBoard;
var level;
var rowCounter;
//////////////////////
function PlayModule() {
  this.id = 'play';
  this.label = 'Play';
}

PlayModule.prototype.start = function(data) {
  log('play start',data.current);
  setMode(GameMode.READY);
}

PlayModule.prototype.update = function(container) {
  log('play update');
  container.empty();
  
  gameBoard = d3.select('#moduleContent').append("svg")
    .attr('class','graphics')
    .attr('id', 'gameBoard');
        
  var width = $('#gameBoard').width(), height = $('#gameBoard').height();
  
  var pad = Math.floor(width * .2);
  log(pad);
  

	log(width);
	log(height);
	
	x = d3.scale.linear()
		.domain([0, WIDTH])
		.range([0,width]);
	
	y = d3.scale.linear()
		.domain([0, HEIGHT])
		.range([0, height]);
			
	// Using for loop to draw multiple horizontal lines
	for (var i=0; i <= HEIGHT; i++) {
			gameBoard.append("svg:line")
					.attr("x1", x(0))
					.attr("y1", y(i))
					.attr("x2", x(WIDTH))
					.attr("y2", y(i))
					.style("stroke", "rgb(6,120,155)")
	};
	 
	// Using for loop to draw multiple vertical lines
	for (var i=0; i <= WIDTH; i++) {
			gameBoard.append("svg:line")
					.attr("x1", x(i))
					.attr("y1", y(0))
					.attr("x2", x(i))
					.attr("y2", y(HEIGHT))
					.style("stroke", "rgb(6,120,155)")
	};
  
  draw();
}

PlayModule.prototype.end = function() { clearTimeout(timer) }

function initNewGame() {
	mode = GameMode.READY;
	storedTiles = []; // initTiles(recent);
	score = 0;
	stepDelay = 1000;
	Shape.init(WIDTH/2,-1,Shape.randomShape());
	level = 1;
	rowCounter = 0;
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
}

// Possible game "modes"
var GameMode = {
  PAUSE : {value: 0, name: "Pause"}, 
  READY: {value: 1, name: "Ready"}, 
  RUNNING : {value: 2, name: "Running"},
  LOSE : {value: 3, name: "Lose"}
}

// Listen for keydown events
d3.select(window).on("keydown", function() {
	var keyCode = d3.event.keyCode;
	// Up Arrow
	if (keyCode == 38) {
		if(mode == GameMode.RUNNING) {
			// Rotate shape 
			newShape = Shape.rotateLeft();
			if(isPossibleMovement(0,0,newShape)) {
				Shape.State.currentShape = newShape;
				draw();
			}
		}
	}
	// Left Arrow
	else if(keyCode == 37) {
		if(mode == GameMode.RUNNING) {
			if(isPossibleMovement(-1,0,Shape.State.currentShape)) {
				Shape.State.x = Shape.State.x - 1;
				draw();
			}
		}
	}
	// Right Arrow
	else if(keyCode == 39) {
		if(mode == GameMode.RUNNING) {
			if(isPossibleMovement(1,0,Shape.State.currentShape)) {
				Shape.State.x = Shape.State.x + 1;
				draw();
			}
		}
	}
	// Down Arrow
	else if(keyCode == 40) {
		if(mode == GameMode.RUNNING) {
			if(isPossibleMovement(0,1,Shape.State.currentShape)) {
				Shape.State.y = Shape.State.y + 1;
				draw();
			}
		}
	}
	// Space bar
	else if(keyCode == 32) {
		if(mode == GameMode.RUNNING) {
			// Pause game
			setMode(GameMode.PAUSE);
		}
		else if(mode == GameMode.PAUSE) {
			// Resume game
			setMode(GameMode.RUNNING);
		}
		else if (mode == GameMode.READY) {
			// Start a new game
			setMode(GameMode.RUNNING);
		}
		else if (mode == GameMode.LOSE) {
			// Set up new game
			initNewGame();
			setMode(GameMode.READY);
		}
	}
	return;
}); // End Listen for key down events

// Collision detection
function isPossibleMovement(x, y, shape) {
	// Iterate through shape tiles
	for(var i = 0; i < shape.length; i++) {
		// Check collision with walls.
		if(x + shape[i].x + Shape.State.x < 0) {
			return false;
		}
		else if(x + shape[i].x + Shape.State.x > WIDTH-1) {
			return false;
		}
		// Don't worry about the top of the game board
		//else if(y + shape[i].y + Shape.State.y < 0) {
		//	return false;
		//}
		else if(y + shape[i].y + Shape.State.y > HEIGHT-1 ){
			return false;
		}
	// Check for collision with stored tiles.
	for(var j = 0; j < storedTiles.length; j++) {
			if( storedTiles[j].x == x + shape[i].x + Shape.State.x && storedTiles[j].y == y + shape[i].y + Shape.State.y) {
				return false;
			}
		}
	}
	return true;
};
	
// Draw stuff
function draw() {
	// Update actice piece
	var rect = gameBoard.selectAll("rect")
		.data(Shape.State.currentShape);
	
	rect.enter().append("rect")
		.attr("width", x(1))
		.attr("height", y(1))
		.style("fill", "green");
	
	rect
	//.transition()
		.attr("x", function(d,i) { return x(Shape.State.x + d.x) } )
		.attr("y", function(d,i) { return y(Shape.State.y + d.y) } );
		
	rect.exit().remove();

	// Update stored tiles
	var ellipse = gameBoard.selectAll("ellipse")
		.data(storedTiles);

	// Append new tiles
	ellipse.enter().append("ellipse")
		.attr("rx", x(.5))
		.attr("ry", y(.5))
		.style("stroke", "black")
		.style("fill", "blue");

	// Set attr for all tiles
	ellipse
		.attr("cx", function(d) { return x(d.x + .5); })
		.attr("cy", function(d) { return y(d.y + .5); });
		
	// Remove cleared tiles
	ellipse.exit().remove();
};

// Move active piece down or add it to the stored tiles	
function step() {
	// Check if we can move active piece down
	if(isPossibleMovement(0,1,Shape.State.currentShape)) {
		Shape.State.y = Shape.State.y + 1;
	}
	else {
		// Add tiles to stored tiles
		Shape.State.currentShape.forEach( function(p){
			storedTiles.push({x: Shape.State.x + p.x, y: Shape.State.y + p.y});
			// Check tiles are in top row
			if( Shape.State.y + p.y == 0 ){
				setMode(GameMode.LOSE);
			}
		});
		// Clear filled rows	
		var numClearedRows = deletePossibleRows();
		rowCounter += numClearedRows;
		
		if(rowCounter >= ROWSPERLEVEL * level) {
			level++;
			stepDelay = Math.floor(stepDelay * 0.9);
		}
		
		score += 10 * numClearedRows;
		score++;
		// Create a new piece
		createNewPiece();
	}
	draw();
};

// Iterates through each row and returns the number
// of filled rows that are removed
function deletePossibleRows(){
	var rowsDeleted = 0;
	for(var j = 0; j < HEIGHT; j++){
		if( WIDTH == storedTiles.filter(function(d) {
			return (d.y == j);
		}).length) {
			deleteRow(j);
			rowsDeleted++;
		}
	}
	return rowsDeleted;
};

// Removes the tiles in the specified row and shifts 
// all the tiles above down one row.
function deleteRow(y) {
	// Get a list of tiles that does not include any 
	// from the specified row.
	storedTiles = storedTiles.filter(function(d) {
		return (d.y != y);
	});
	// Shift tiles that are above the specfied row down by one
	for(var i = 0; i < storedTiles.length; i++){
		if( storedTiles[i].y < y) {
			storedTiles[i].y = storedTiles[i].y + 1;
		}	
	};
};
	
function createNewPiece() {
	Shape.State.y = -1;
	Shape.State.x = WIDTH/2;
	Shape.State.currentShape = Shape.randomShape();
};
	
function setMode(newMode) {
	oldMode = mode;
	mode = newMode;
		
	if(newMode == GameMode.RUNNING && oldMode != GameMode.RUNNING) {
		// playing game
		update();
	}
	else if(newMode == GameMode.PAUSE){
		// pause game
		clearTimeout(timer);
	}
	else if(newMode == GameMode.READY){
		// init game
		initNewGame();
	}
	else if(newMode == GameMode.LOSE){
		// end game
		clearTimeout(timer);
		log(score);
		log(rowCounter);
		log(level);
		log(stepDelay);
	}
	
	return;
};
	
function update() {
	if (mode == GameMode.RUNNING) {
		step();
	}
	timer = setTimeout(update,stepDelay);
};

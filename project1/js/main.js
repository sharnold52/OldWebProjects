// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application(800,800);
let content = document.querySelector(".gameInner");
content.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
PIXI.loader.
add(["images/player.png","images/npc.png", "images/startButton.png", "images/title.png", "images/end.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(setup);

// rating
let rating = 0;

// aliases
let stage;

// clear once
let cleared = false;

// game variables
let startScene;
let gameScene,player;
let endScene;
let menuMusic, gameMusic, endMusic;
let menuFade = false, gameFade = false, endFade = false;

// controls
let left, right, down, up;

// end scene references
let againButton, endLabel;

// speed and location of player
let speedY = 0, maxSpeed = 2, speedX = 0, distance = 0, looped = false;

// npc groups
let followers = [], runners = [], squareRunners = [];

let paused = true;

// set up function
function setup() {
	// get rating and set rating if it exists
	if(parseInt(localStorage.getItem("rating-arnoldGame")))
	{
		rating = parseInt(localStorage.getItem("rating-arnoldGame"));
		let seek = 6 - rating;
		document.querySelector(".star:nth-of-type("+ seek +")").setAttribute("checked", "true");
	}
	
	
	//add event listeners to all star buttons
	let stars = document.querySelectorAll(".star");
	for(let i = 0; i < stars.length; i++)
	{
		stars[i].addEventListener("click", saveRating);
	}
	
	
	stage = app.stage;
	
	// Create the `start` scene
	startScene = new PIXI.Container();
	startScene.zIndex = 0;
	stage.addChild(startScene);
	
	// Create the main `game` scene and make it invisible
	gameScene = new PIXI.Container();
	gameScene.zIndex = 1;
	
	gameScene.visible = false;
	stage.addChild(gameScene);

	// Create the `end` scene and make it invisible
	endScene = new PIXI.Container();
	endScene.zIndex = 2;
	endScene.visible = false;
	stage.addChild(endScene);
	
	// Create labels for all 3 scenes
	createLabelsAndButtons();
	
	// Create ship
	player = new Player();
	player.vx = 0;
	player.vy = 0;
	gameScene.addChild(player);
	
	// load sounds
	menuMusic = new Howl({
		src: ['sounds/menuMusic.mp3'],
		volume: 0.4,
		loop: true
	});
	
	gameMusic = new Howl({
		src: ['sounds/gameMusic.mp3'],
		volume: 0.4,
		loop: true
	});
	
	endMusic = new Howl({
		src: ['sounds/endMusic.mp3'],
		volume: 0.4,
		loop: true
	});
	
	menuMusic.play();
	
	// set controls key codes
	left = 37;
	up = 38;
	right = 39;
	down = 40;
	
	// Start update loop
	app.ticker.add(gameLoop);
}



// Buttons and Labels Function
function createLabelsAndButtons() {
	// set up 'startScene'
	// make the top start label
	let startTexture = new PIXI.Texture.fromImage('images/title.png');
	let startLabel1 = new PIXI.Sprite(startTexture);
	startLabel1.x = 50;
	startLabel1.y = 100;
	startScene.addChild(startLabel1);
	
	// make the start game button
	let textureButton = new PIXI.Texture.fromImage('images/startButton.png');
	let startButton = new PIXI.Sprite(textureButton);
	startButton.interactive = true;
	startButton.buttonMode = true;
	startButton.x = 50;
	startButton.y = 200;
	startButton.on('pointerup', startGame); // startGame is a function reference
	startButton.on('pointerover', e=>e.target.alpha = 0.7); // concise arrow function with no brackets
	startButton.on('pointerout', e=>e.currentTarget.alpha = 1.0); // ditto
	startScene.addChild(startButton);
	
	// set up 'gameScene'
	let textStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 18,
		fontFamily: "Verdana",
		stroke: 0xFF0000,
		strokeThickness: 4
	});
	
	// set up `endScene`
	// make end text
	let endTexture = new PIXI.Texture.fromImage('images/end.png');
	endLabel = new PIXI.Sprite(endTexture);
	endLabel.alpha =0;
	endLabel.x = 175;
	endLabel.y = 200;
	endScene.addChild(endLabel);
	
	// make "play again?" button
	let textureAgain = new PIXI.Texture.fromImage('images/playAgain.png');
	againButton = new PIXI.Sprite(textureAgain);
	againButton.alpha = 0;
	againButton.interactive = true;
	againButton.buttonMode = true;
	againButton.x = 310;
	againButton.y = 500;
	againButton.on('pointerup', startGame); // startGame is a function reference
	againButton.on('pointerover', e=>e.target.alpha = 0.7); // concise arrow function with no brackets
	againButton.on('pointerout', e=>e.currentTarget.alpha = 1.0); // ditto
	endScene.addChild(againButton);
}

// keyboard input
let keysDown = [];
function onKeyDown(key) {
	let keyPresent = false;
	
	for(let i = 0; i < keysDown.length; i++)
	{
		if(keysDown[i].keyCode === key.keyCode)
		{
			keyPresent = true;
		}
	}
	
	if(!keyPresent)
	{
		keysDown.push(key);
	}
}
function onKeyUp(key){
	
	keysDown = keysDown.filter(function(a){return a.keyCode !== key.keyCode;});
}


// controls movement
function movement(key){
	if(speedX < maxSpeed)
	{
		if (key.keyCode === right)
		{
			speedX += 1;
		}
	}
	
	if (Math.abs(speedX) < maxSpeed)
	{
		if(key.keyCode === left)
		{
			speedX -= 1;
		}
	}
	
	if(speedY < maxSpeed)
	{
		if (key.keyCode === down)
		{
			speedY += 1;
		}
	}
	
	if (Math.abs(speedY) < maxSpeed)
	{
		if (key.keyCode === up)
		{
			speedY -= 1;
		}
	}
}

// start game function
function startGame() {
	// pause menu  and end music
	menuMusic.pause();
	endMusic.pause();
	
	// reset cleared
	cleared = false;
	
	// start fade and switch screens
	menuFade = true;
	endFade = true;
	
	// turn on game music
	gameMusic.play();
	
	// change scenes
	gameFade = false;
	gameScene.alpha = 1;
	gameScene.visible = true;
	
	// set player position
	player.x = 400;
	player.y= 550;
	
	// reset player
	player.alpha = 1;
	distance = 0;
	
	// turn off pause
	paused = false;
	
	// turn off looping
	looped = false;
	
	// add event listener for keyboard input
	document.addEventListener('keydown',onKeyDown);
	document.addEventListener('keyup',onKeyUp);
	
	// create the followers
	new createNPCs();
}

// create the NPCs
function createNPCs(){
	// followers
	new createFollower(400, -400);
	new createFollower(325, -200);
	new createFollower(475, 100);
	new createFollower(550, -800);
	new createFollower(250, -500);
	
	// runners
	new createRunner(150, -2600);
	new createRunner(210, -2575);
	new createRunner(200, -2650);
	new createRunner(675, -2920);
	new createRunner(750, -2930);
	new createRunner(700, -2980);
	new createRunner(770, -3870);
	new createRunner(680, -3825);
	new createRunner(740, -3800);
	new createRunner(670, -3900);
	new createRunner(730, -3925);
	new createRunner(30, -4230);
	new createRunner(140, -4260);
	new createRunner(100, -4200);
	new createRunner(45, -4300);
	new createRunner(120, -4325);
	
	
	// runners that move in square before player contact
	// First Group
	new createSquareRunner(100, -3200, 1);
	new createSquareRunner(200, -3200, 2);
	new createSquareRunner(200, -3100, 3);
	new createSquareRunner(100, -3100, 4);
	// Sccond Group
	new createSquareRunner(650, -3500, 1);
	new createSquareRunner(750, -3500, 2);
	new createSquareRunner(750, -3400, 3);
	new createSquareRunner(650, -3400, 4);
	
	// special pattern Group
	new createSquareRunner(400, -5000, 1);
	new createSquareRunner(400, -5000, 2);
	new createSquareRunner(400, -5000, 3);
	new createSquareRunner(400, -5000, 4);
	new createSquareRunner(300, -5100, 1);
	new createSquareRunner(500, -5100, 2);
	new createSquareRunner(500, -4900, 3);
	new createSquareRunner(300, -4900, 4);
}


function createLoop()
{
	// player is now in loop
	if(distance < -5500)
	{
		// player is now looping
		looped = true;
	}
	
	// loop
	if (looped && distance < -3000)
	{
		// reset distance
		distance = 0;
		
		// create the npc's
		// 1
		new createRunner(30, -130);
		new createRunner(140, -160);
		new createRunner(100, -100);
		new createRunner(45, -200);
		new createRunner(120, -225);
		
		// 2
		new createSquareRunner(500, -600, 1);
		new createSquareRunner(600, -700, 2);
		new createSquareRunner(700, -600, 3);
		new createSquareRunner(600, -500, 4);
		
		// 3
		new createSquareRunner(100, -1100, 1);
		new createSquareRunner(200, -1100, 2);
		new createSquareRunner(200, -1000, 3);
		new createSquareRunner(100, -1000, 4);
		
		// 4
		new createSquareRunner(600, -1600, 1);
		new createSquareRunner(700, -1700, 3);
		new createSquareRunner(700, -1600, 2);
		new createSquareRunner(600, -1700, 4);
		
		// 5
		new createRunner(770, -2030);
		new createRunner(660, -2060);
		new createRunner(700, -2000);
		new createRunner(755, -2100);
		new createRunner(680, -2125);
		
		// 6
		new createSquareRunner(300, -2500, 1);
		new createSquareRunner(300, -2500, 2);
		new createSquareRunner(300, -2500, 3);
		new createSquareRunner(300, -2500, 4);
		new createSquareRunner(200, -2500, 1);
		new createSquareRunner(300, -2600, 2);
		new createSquareRunner(400, -2500, 3);
		new createSquareRunner(300, -2400, 4);
	}
	
	// check if player is stopped
	if(Math.abs(speedY) < 0.01 && Math.abs(speedX) < 0.01 && looped)
	{
		player.alpha -= 0.003;
	}
	
	// check if player has disappeared. End game
	if(player.alpha <= 0)
	{
		end();
	}
}

// follows player at beginning
function createFollower(x, y){
	let f = new NonPlayer(x, y);
	followers.push(f);
	gameScene.addChild(f);
}

// runs away from player. Remains still before contact
function createRunner(x, y){
	let r = new NonPlayer(x, y);
	runners.push(r);
	gameScene.addChild(r);
}

// runners that move in square before player contact
function createSquareRunner(x, y, squarePos){
	let r = new NonPlayerSquare(x, y, squarePos);
	squareRunners.push(r);
	runners.push(r);
	gameScene.addChild(r);
}

// move the followers
function moveFollowers(){
	for(let i = 0; i < followers.length; i++)
	{
		if(followers[i].y > player.y + (Math.abs((sceneWidth/2) - followers[i].x) * 0.5) + 60)
		{
			
		}
		else
		{
			followers[i].y -= speedY;
		}
	}
	
	
	// followers fade away
	if(distance < -1500)
	{
		if(speedY < -0.1)
		{
			if(followers.length > 0)
			{
				if(followers[followers.length - 1].alpha <= 0)
				{
					followers[followers.length - 1].visible = false;
					followers.pop();
				}
				else
				{
					followers[followers.length - 1].alpha -= 0.01;
					followers[followers.length - 1].y += 0.2;
				}
			}
		}
	}
}

// move the runners
function moveRunners(){
	for(let i = 0; i < runners.length; i++)
	{
		runners[i].y -= speedY;
		
		// check if runner is off screen
		if(runners[i].y >= 900)
		{
			// remove runner and increment i down
			gameScene.removeChild(runners[i]);
			runners.splice(i, 1);
			i--;
		}
	}
}

// does square runners motion
function moveSquareRunners(){
	for(let i = 0; i < squareRunners.length; i++)
	{
		// checks their position and moves them accordingly... should look like square dance
		if(squareRunners[i].squarePos === 1)
		{
			// move right
			squareRunners[i].x += 1;
			squareRunners[i].positionTracker += 1;
			
			// check if square is moving in different direction now
			if(squareRunners[i].positionTracker === 100)
			{
				squareRunners[i].squarePos = 2;
				squareRunners[i].positionTracker = 0;
			}
		}
		else if(squareRunners[i].squarePos === 2)
		{
			// move down
			squareRunners[i].y += 1;
			squareRunners[i].positionTracker += 1;
			
			// check if square is moving in different direction now
			if(squareRunners[i].positionTracker === 100)
			{
				squareRunners[i].squarePos = 3;
				squareRunners[i].positionTracker = 0;
			}
		}
		else if(squareRunners[i].squarePos === 3)
		{
			// move left
			squareRunners[i].x -= 1;
			squareRunners[i].positionTracker += 1;
			
			// check if square is moving in different direction now
			if(squareRunners[i].positionTracker === 100)
			{
				squareRunners[i].squarePos = 4;
				squareRunners[i].positionTracker = 0;
			}
		}
		else
		{
			// move up
			squareRunners[i].y -= 1;
			squareRunners[i].positionTracker += 1;
			
			// check if square is moving in different direction now
			if(squareRunners[i].positionTracker === 100)
			{
				squareRunners[i].squarePos = 1;
				squareRunners[i].positionTracker = 0;
			}
		}
	}
}

function runAway(){
	for(let i = 0; i < runners.length; i++)
	{
		// check distance
		let distanceX = player.x-runners[i].x;
		let distanceY = player.y-runners[i].y;
		
		if(Math.abs(distanceX) < 100 && Math.abs(distanceY) < 100)
		{
			runners[i].run = true;
		}
		
		if(runners[i].run)
		{
			// calculate player location
			let fractionY = distanceY / (Math.abs(distanceX) + Math.abs(distanceY));
			let fractionX = distanceX / (Math.abs(distanceX) + Math.abs(distanceY));
			
			// run away from player
			runners[i].x -= 5 * fractionX;
			runners[i].y -= 5 * fractionY;
			
			// check if off screen
			if (runners[i].x > sceneWidth + 5 || runners[i].x < -5 || runners[i].y > sceneHeight + 5 || runners[i].y < -5)
			{
				// remove runner and increment i down
				let current = runners[i];
				runners.splice(i, 1);
				i--;
				
				// destroy object
				gameScene.removeChild(current);
			}
		}
	}
}


// ends level
function end(){
	// remove event listener
	document.removeEventListener('keydown',onKeyDown);
	document.removeEventListener('keyup',onKeyUp);
	
	// start transition to end scene
	gameFade = true;
	endScene.visible = true;
}

function clear(){
	// clear out level
	runners.forEach(c=>gameScene.removeChild(c)); 
	runners = [];
	
	followers.forEach(c=>gameScene.removeChild(c));
	followers = [];
	
	squareRunners.forEach(c=>gameScene.removeChild(c));
	squareRunners = [];
	
	// stop game music
	gameMusic.fade(0.4, 0, 2000);
	
	// start end music
	endMusic.play();
}

// game loop
function gameLoop(){
	if (paused) return;
	
	// handle movement
	for(let i = 0; i < keysDown.length; i++)
	{
		movement(keysDown[i]);
	}
	
	// create loop if necessary
	createLoop();
	
	// Runners run away, square runners dance
	runAway();
	moveSquareRunners();
	
	//check bounds then move player
	if(player.x < 0)
	{
		player.x += 1;
	}
	else if (player.x > sceneWidth)
	{
		player.x -= 1;
	}
	else
	{
		player.x += speedX;
	}
	
	// if player is at middle of screen move everyone else
	if(player.y < sceneHeight/2)
	{
		// if player is trying to move backwards
		if(speedY > 0)
		{
			player.y += speedY;
			distance += speedY;
		}
		// if player is moving forward
		else if (speedY < 0.1)
		{
			moveFollowers();
			moveRunners();
			distance += speedY;
		}
	}
	// if player is at bottom edge
	else if (player.y > sceneHeight)
	{
		distance -= player.y - sceneHeight;
		player.y = sceneHeight;
	}
	else
	{
		player.y += speedY;
		distance += speedY;
	}
	
	// fade in transitions
	if(menuFade)
	{
		
		// fade out
		startScene.alpha -= 0.05;
		
		// make it invisible and reset alpha
		if(startScene.alpha <= 0)
		{
			startScene.visible = false;
			startScene.alpha = 1;
			menuFade = false;
		}
	}
	if(gameFade)
	{
		// fade out scene fade in button
		gameScene.alpha -= 0.01;
		
		// make it invisible and reset alpha
		if(gameScene.alpha <= 0)
		{
			gameScene.visible = false;
			gameScene.alpha = 1;
			gameFade = false;
		}
		
		// fade in label
		if (gameScene.visible === false && endLabel.alpha < 1)
		{
			endLabel.alpha += 0.01;
			if(!cleared)
			{
				clear();
				cleared = true;
			}
		}
		// then fade in button
		if(gameScene.visible === false && endLabel.alpha >= 1 && againButton.alpha < 1)
		{
			againButton.alpha += 0.01;
			
			if(againButton.alpha >= 1)
			{
				paused = true;
			}
		}
	}
	if(endFade)
	{
		// switch z index so we can fade into game
		endScene.zIndex = 1;
		gameScene.zIndex = 2;
		endScene.alpha -= 0.05;
		
		// make it invisible and reset alpha
		if(endScene.alpha <= 0)
		{
			endScene.visible = false;
			endScene.alpha = 1;
			endFade = false;
			
			// switch z index again
			endScene.zIndex = 1;
			gameScene.zIndex = 2;
			
			// ready next end screen
			againButton.alpha = 0;
			endLabel.alpha = 0;
		}
	}

	// friction
	speedX *= 0.80;
	speedY *= 0.80;
}

// save the rating to local storage
function saveRating()
{	
	// check what is checked
	if(document.querySelector(".star-5").checked)
	{
		rating = 5;
	}
	else if(document.querySelector(".star-4").checked)
	{
		rating = 4;
	}
	else if(document.querySelector(".star-3").checked)
	{
		rating = 3;
	}
	else if(document.querySelector(".star-2").checked)
	{
		rating = 2
	}
	else
	{
		rating = 1;
	}
	
	localStorage.setItem("rating-arnoldGame", rating);
}
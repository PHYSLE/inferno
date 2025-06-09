/* ---------------------------


Copyright © 2007 - 2017 PHYSLE
All rights reserved.

--------------------------- */

import * as createjs from 'createjs-module';
import Put from '/src/inferno.factory.js';
import Player from '/src/inferno.player.js'

function $(q) {
	return document.querySelector(q);
}

var KEY_LEFT = 37,
	KEY_RIGHT = 39,
	KEY_UP = 38, 
	KEY_DOWN = 40, 
	KEY_SPACE = 32,
	KEY_TILDE = 192,
	KEY_ESCAPE = 27


//http://createjs.com/docs

var Game = {
	UI:{},
	MOVING_RIGHT: false, 
	MOVING_LEFT: false, 
	MOVING_DOWN: false,
	currentLevel:1,
	gravity:50,
	paused:true,
	goal:0,
	stage:null,
	screen:null,
	screen2:null,
	width:1000,
	height:500,
	ytarget:0,
	ycamera:0,
	ycamspeed:800,
	ycamoffset:420,
	yterminate:800, // point where player dies, LoadLevel will figure this out dynamically
	level:null,
	levelMaps:["100","200","300","400","500","600","700","800","900","1000","portals","secret"],
	sounds:["bounce","branch","coins","death","door","flap","harp","harp2","key","spring","turbo"],
	images:["balloon","bonus","branch","coin","exit","fist","head","key","ladder",
			"lava","particle","player_r","player_l","portal","spring","temple","turbo",
			"block1","block2","block3","block4","block5","block6"],
	music:{
		passages:["passage1","passage2","passage3","passage4","passage5"],
		index:0,
		sound:null,
		preloaded:false
	},
	debug:false,
	maxDelta:0, // for debugging
	minFPS:120, //
	ticks:0,
	sky:null,
	exit:null,
	bonus:null,
	loadedBonus:false,
	temple:null,
	cookieName:"PslInf",
	justRestored:false,
	unlock:0,
	settings:{
		sound:true,
		music:false,
		efx:true,
		touch:false
	},

	init: function() {
		// https://stackoverflow.com/questions/44828676/preloadjs-not-working-on-angular-createjs-module
		window.createjs = createjs;
		var queue = new createjs.LoadQueue(true);
		createjs.Sound.alternateExtensions = ['mp3']
		queue.installPlugin(createjs.Sound);
		queue.addEventListener('complete', Game.loadedQueue);
		queue.addEventListener('error', function(e) {console.error(e)} );
		
		//queue.on("complete", Game.loadedQueue, this);
		queue.on("fileload", function(event) {
			//console.log(event.item);
			if (event.item.type == "image") {
				// not sure what the image preload is really buying us here ??
				// the DOM doesn't get updated so...
				var img = document.createElement("img");
				img.src = event.item.src;

				
			}
		});
		

		for (var i=0; i<Game.sounds.length; i++) {
			//console.log("loading " + Game.sounds[i]);
			createjs.Sound.registerSound("assets/sounds/"+Game.sounds[i]+".mp3", Game.sounds[i]);
			var li = new createjs.LoadItem();

			li.src = "assets/sounds/"+Game.sounds[i]+".mp3";
			li.id = Game.sounds[i]+".mp3";

			queue.loadFile(li, false);
		}
		if (Game.settings.music) {
			// we will lazy load the remaining passages
			var li = new createjs.LoadItem();
			
			li.src = "assets/sounds/"+Game.music.passages[0]+".mp3";
			li.id = Game.music.passages[0]+".mp3";
			queue.loadFile(li, false);
		}
		
		for (var i=1; i<Game.images.length; i++) {
			var li = new createjs.LoadItem();
			li.src = "assets/images/"+Game.images[i]+".png";
			li.id = Game.images[i]+".png";

			queue.loadFile(li, false);	
		
		}
		
		for (var i=1; i<5; i++) {
			var li = new createjs.LoadItem();
			li.src = "assets/images/sky"+i+".png";
			li.id = "sky"+i+".png";

			queue.loadFile(li, false);	
		
		}
	   
		queue.load(); // handled by loadedQueue
	
		document.onkeydown = function (event) {
			switch(event.keyCode) {
				case KEY_LEFT:	
					if (!Game.MOVING_LEFT) {
						// don't reanimate when holding down l/r
						Player.move(KEY_LEFT);
					}
					Game.MOVING_LEFT = true;
					break;
				case KEY_RIGHT: 
					if (!Game.MOVING_RIGHT) {
						// don't reanimate when holding down l/r
						Player.move(KEY_RIGHT);
					}
					Game.MOVING_RIGHT = true;
					break;
				case KEY_UP: 
					Player.jump();
					break;
				case KEY_DOWN: 
					Game.MOVING_DOWN = true;
					break;
				case KEY_SPACE: 
					Player.jump();
					break;
				case KEY_ESCAPE: 
					Game.pause();
					break;
				case KEY_TILDE: 
					Game.debug = !Game.debug;
					if (Game.debug) {
						$("#debug").style.display('block');
					}
					else {
						$("#debug").style.display('none');
					}
					break;
			}
		}

		document.onkeyup = function (event) {
			switch(event.keyCode) {
				case KEY_LEFT:	
					Game.MOVING_LEFT = false;
					break;
				case KEY_RIGHT: 
					Game.MOVING_RIGHT = false;
					break;
				case KEY_DOWN: 
					Game.MOVING_DOWN = false;
					break;
			}
		}
		
		
;		$('#canvas').width =  Game.width;
		//$('#canvas').height = Game.height;

		//$('#canvas').width = Math.min(window.screen.width, Game.width);
		$('#canvas').height = Math.min(window.screen.height, Game.height);


		createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
		createjs.Ticker.setFPS(30);
		createjs.Ticker.addEventListener("tick", Game.update);


	},
	
	pause:function() {
		// not before a level is loaded
		if (Game.level) { 
			Game.paused = !Game.paused;
			if (!Game.paused) {
				$("#menu").style.display='none';
				if (Game.music.sound) {
					Game.music.sound.paused = false;
				}
			}
			else {
				$("#menu").style.display='block';
				if (Game.music.sound) {
					Game.music.sound.paused = true;
				}
			}
		}

		$('#touch-controls').style.display = 'none'
			
	},
	
	loadedQueue: function(event) {
		Game.stage = new createjs.Stage("canvas");    
		Game.loadState();
		
		Game.sky = Put.sky("assets/images/sky3.png");
		Game.stage.update();
		
		Game.UI.score = $("#score");
		Game.UI.goal = $("#goal");
		$('#menu-new').addEventListener("click",function() {
			Game.start(); 
			$("#menu").style.display='none';
		});
		
		$("#loading").style.display='none'; 
		$("#menu").style.display='block'; 
		 
	},
	
	start: function() {
		Player.score = 0;
		Player.bonusScore = 0;
		if (Game.unlock > 0) {
			Game.currentLevel = 11;
		}
		else {
			Game.currentLevel = 1;
		}
		Game.justRestored = false;
		Game.loadLevel();
		$("#menu-continue").classList.remove("inactive");
		$("#menu-continue").addEventListener("click", Game.resume);

		if (Game.settings.music) {
			if (Game.music.sound) {
				Game.music.sound.stop(); 
			}
			Game.playMusic();
		}
		if(Game.settings.touch) {
			$('#touch-controls').style.display = 'block'
		}
		else {
			$('#touch-controls').style.display = 'none'
		}
	},
	
		
	resume: function() {
		Game.justRestored = false;
		Game.paused = false;
		if (!Game.level) {
			Game.loadLevel();
		}
		if (Game.settings.music) {
			if (Game.music.sound) {
				Game.music.sound.paused = false; 
			}
			else {
				Game.playMusic();
			}
		}
		$("#menu").style.display = 'none';
		if(Game.settings.touch) {
			$('#touch-controls').style.display = 'block'
		}
		else {
			$('#touch-controls').style.display = 'none'
		}
	},
	
	loadState: function() {
		// https://developer.mozilla.org/en-US/docs/Web/API/document/cookie
		var cookieValue = decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + 
			encodeURIComponent(Game.cookieName).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;

		if (cookieValue) {	
			var state = JSON.parse(cookieValue);
		
			//state.level=12;
		
			console.log(cookieValue);		
			Player.score = state.bonus;
			Player.bonusScore = state.bonus;
			
			Game.currentLevel = state.level;
			Game.unlock = state.unlock;
			Game.settings.sound = state.sound;
			Game.settings.music = state.music;
			Game.settings.efx = state.efx;
			Game.settings.touch = state.touch;
			
			
			$("#opt-sound").checked = state.sound;
			$("#opt-music").checked = state.music;
			$("#opt-effects").checked = state.efx;
			$("#opt-touch").checked = state.touch;


			if (Game.currentLevel > 1) {
				$("#menu-continue").classList.remove("inactive");
				$("#menu-continue").addEventListener("click", Game.resume);
			}
			
		}		
		Game.justRestored = true;		
	},
	
	
	saveState: function() {	
		var cookieValue = '{"level":'+Game.currentLevel+
						',"bonus":'+Player.bonusScore+
						',"unlock":'+Game.unlock+
						',"sound":'+Game.settings.sound+
						',"music":'+Game.settings.music+
						',"efx":'+Game.settings.efx+
						',"touch":'+Game.settings.touch+
						'}';		

		document.cookie = Game.cookieName + "=" + encodeURIComponent(cookieValue) +"; expires=Fri, 31 Dec 9999 23:59:59 GMT";
		
	},
	
	loadLevel: function() {		
		if (Game.currentLevel > Game.levelMaps.length) {
			Game.stage = new createjs.Stage("canvas");  
			var lvlDiv = $('#level');
			lvlDiv.fadeIn(0);
			lvlDiv.html("The End");
			lvlDiv.fadeOut(5000);
			return;	
		}
	
	
		var dt = Date.now();
		var map = "assets/levels/" + Game.levelMaps[Game.currentLevel-1] + ".json?dt=" + dt;
		console.log(map);

		Game.stage = new createjs.Stage("canvas");	
		Game.paused = true; // pause until load is complete		
		Game.goal = 0;	

		fetch(map, {method: 'GET'})
			.then(function(response) { return response.json(); })
			.then(function(json) {
				Game.loadedLevel(json);
			});	
	},
	
	loadedLevel: function(data) {
		if (!Game.justRestored && (!Game.level || Game.level.name != data.name)) {
				
			var lvlDiv = $('#level');
			lvlDiv.style.opacity = 1;
			lvlDiv.innerHTML=data.name;
			lvlDiv.style.transition = '5.0s';
			lvlDiv.style.opacity = 0;

			/*
			var hintDiv = $('#hint');
			hintDiv.style.opacity = 1;
			hintDiv.innerHTML=data.hint;
			hintDiv.style.transition = '5.0s';
			hintDiv.style.opacity = 0;
			*/
		}
		
		Game.level = data;
		if (Game.level.sky) {
			Game.sky = Put.sky('assets/' + Game.level.sky);
		
		}
		/*
		if (Game.screen) { // hack to show last level in screen2
			Game.screen.removeChild(Player.sprite);	
			Game.screen2 = Game.screen;
			Game.screen2.scaleX = .4;
			Game.screen2.scaleY = .4;
			Game.stage.addChild(Game.screen2);
		}
		*/
		Game.screen = new createjs.Container();
		Game.stage.addChild(Game.screen);
		
		//if (Game.currentLevel >= 9) {
			Game.screen.scaleX = .7;
			Game.screen.scaleY = .7;
		//}
		
		Game.loadedBonus = false;
		Player.hasKey = false;
		//Player.hasKey = true; // DEBUG
		$("#key").innerHTML='';
		
		Game.saveState();
		
		Game.parseMap(Game.level.map);		
		Game.yterminate += 160;
		Game.ytarget = -(Player.sprite.y) + Game.ycamoffset;
		Game.screen.y = -(Player.sprite.y) + Game.ycamoffset;
		
		if (Game.currentLevel == 11) {
			Game.goal = 300;
		}
		Game.updateScore();
		
		if (Game.level.sky == "assets/images/sky1.png" || Game.level.sky == "assets/images/sky2.png") {
			Game.lava = Put.lava(0, 550, 255, 0, 0);
		}
		else {
			Game.lava = Put.lava(0, 550, 255, 180, 0);
		}
		
		if (!Game.justRestored) {
			Game.paused = false;
		}

	},
	
	
	loadBonus:function() {
		// move last screen to 2
		Game.screen.removeChild(Player.sprite);	
		Game.screen2 = Game.screen;	
		
		// load bonus on main screen
		Game.screen = new createjs.Container();
		Game.screen.scaleX = .5;
		Game.screen.scaleY = .5;
		Game.stage.addChild(Game.screen);	
		Game.stage.addChild(Game.screen2);
		
		var goal = Game.goal;
		
		Game.parseMap(Game.level.bonus);	
		
		// bonus points don't change goal
		Game.goal = goal;

	},
	
	
	exitBonus:function() {
		// swap the screens except for the player		
		Game.screen.removeChild(Player.sprite);		
		Game.screen2.addChild(Player.sprite);
		
		var temp = Game.screen;

		Game.screen = Game.screen2 ;
		Game.screen2 = temp;	

		Player.sprite.x = Game.bonus.sprite.x;
		Player.sprite.y = Game.bonus.sprite.y;
	
	},
	
	parseMap:function(map) {
	
		var px,py;
	
		var isBlock = function(c) {
			return (c == "=" || c == "v" || c == "^" || c == "<" || c==">" || c=="L" || c=="T");
		}

		for(var y=0; y<map.length; y++) {
			for(var x=0; x<map[y].length; x++) {
				var current = map[y][x];
				var gameX = x*30;
				var gameY = y*30;
				if (current == "o") {
					px = gameX;
					py = gameY;
				}
				else if (current == "$") {
					Put.coin(gameX+15,gameY);
				}
				else if (current == "#") {
					Put.ladder(gameX,gameY);
				}
				else if (current == "z") {
					Put.spring(gameX,gameY);
				}
				else if (current == "w") {
					Put.turbo(gameX,gameY);
				}
				else if (current == "@") {
					Put.balloon(gameX,gameY);
				}
				else if (current == "-") {
					Put.branch(gameX,gameY);
				}
				else if (current == "?") {
					Put.key(gameX,gameY);
				}
				else if (current == "b") {
					Game.bonus = Put.bonus(gameX,gameY);
				}
				else if (current == "e") {
					Put.bonusExit(gameX,gameY);
				}
				else if (current == "n") {
					Game.exit = Put.exit(gameX,gameY);
				}
				else if (current == "m") {
					Put.entrance(gameX,gameY);
				}
				else if (current == "g") {
					Put.guard(gameX,gameY);
				}
				else if (current == "t") {
					Game.temple = Put.temple(gameX,gameY);
				}
				else if (/^\d$/.test(current)) {
					Put.portal(gameX,gameY,current);
				}
				else if (isBlock(current)) {
					var prior = x > 0 ? map[y][x-1]:null;
					if (isBlock(prior)) {
						continue; // if the prior is block it should already be put
					}
					
					// build all next blocks into one sprite
					var n=0;
					while (map[y].length > x+n && isBlock(map[y][x+n])) {
						n++;
					}

					var b = Put.block(gameX,gameY,n);

					if (current == "v") {
						b.waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY+300}];
					} 
					else if (current == "^") {
						b.waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY-300}];				
					}
					else if (current == "<") {
						b.waypoints=[{x:gameX,y:gameY},{x:gameX-400,y:gameY}];				
					}
					else if (current==">") {
						b.waypoints=[{x:gameX,y:gameY},{x:gameX+400,y:gameY}];	
					}
					else if (current=="L") {
						b.waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY-300},{x:gameX,y:gameY},{x:gameX+400,y:gameY}];	
					}
					else if (current=="T") {
						b.waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY+300},{x:gameX,y:gameY},{x:gameX-400,y:gameY}];	
					
					}
				
				}
				
				if (gameY > Game.yterminate) {
					Game.yterminate = gameY; 
				}
				
			}
			
		
		} // end map iteration
	
		Player.init(px,py);
	
	},
	
	playSound:function(sound) {
		if (Game.settings.sound) {
			createjs.Sound.play(sound + ".mp3");
		}
	},
	
	playMusic:function() {
		Game.music.sound = createjs.Sound.play(Game.music.passages[Game.music.index]  + ".mp3");	

		if (Game.music.index + 1 < Game.music.passages.length && !Game.music.preloaded) {
			var psg = Game.music.passages[Game.music.index + 1];
			createjs.Sound.registerSound("assets/sounds/"+psg+".mp3", psg+".mp3");
		}

		
		Game.music.sound.on("complete",function() {

			Game.music.index++;
			if (Game.music.index == Game.music.passages.length) {
				Game.music.index = 0;
				Game.music.preloaded = true;
			}

			Game.playMusic() ;
		});
	},
	
	updateSetting:function(setting, state) {
		switch(setting) {
			case "music":
				Game.settings.music = state;
				/*
				if (Game.music.sound && !state) {
					Game.music.sound.stop();
					Game.music.sound = null;
				}
				else {
					Game.playMusic();	
					Game.music.sound.paused = true;
				}*/
				// just reload
				Game.saveState();
				location = 'index.html'
				return;
				break;
			case "sound":
				Game.settings.sound = state;
				break;
			case "efx":
				Game.settings.efx = state;
				break;
			case "touch":
				Game.settings.touch = state;
				if (state) {
					$('#touch-controls').style.display = 'block'
				}
				else {
					$('#touch-controls').style.display = 'none'
				}
				break;

		}
		
		
		Game.saveState();
		
	},
	
	updateScore:function() {		
		Game.UI.score.innerHTML=Player.score
		Game.UI.goal.innerHTML = Game.goal;
		if (Player.score < Game.goal) {
			Game.UI.goal.style.color= "red";
		}
		else if (Player.score == Game.goal) {
			Game.UI.goal.style.color= "white";
			console.log("Game.UI.goal.style.color=" + Game.UI.goal.style.color)
			if (Game.exit) Game.exit.sprite.gotoAndStop(1);
			
			Game.playSound("door");
		}
	},
	
	update:function(event) {

		var delta = event.delta/1000;
		Game.ticks++;

	
		if (Game.debug) {/*
			var fps = createjs.Ticker.getMeasuredFPS().toFixed(1);
			if (fps < Game.minFPS) {
				Game.minFPS = fps;
			}
		
			if (delta > Game.maxDelta) {
				Game.maxDelta = delta;
			}	
		
			$("#debug").html("FPS: "+fps
				+"<br />Min FPS: "+ Game.minFPS
				+"<br />Delta: "+delta.toFixed(3) 
				+"<br />Max Delta: "+ Game.maxDelta.toFixed(3) 
				+"<br />Player: " + Player.sprite.x.toFixed(1) +"," + Player.sprite.y.toFixed(1)
				+"<br />Screen: " + Game.screen.x.toFixed(1) +"," + Game.screen.y.toFixed(1) 
				+"<br />Objects: "+Game.screen.children.length);
			*/
		}

		if (Game.paused) {
			return;
		}
	
		if (delta > .08) {
			delta = .08; // avoid too big of a step with dip in fps
		}
		Player.update(delta);
		
		Game.sky.update(delta);

		if (Game.settings.efx && Game.lava) {
			Game.lava.update(delta);
		}
		
		for(var i=0; i<Game.screen.children.length; i++) {
			var obj = Game.screen.children[i];
			if(obj.UserData && typeof obj.UserData.update === "function") {
				obj.UserData.update(delta);
			}
			else if (obj.name == "points") {
				obj.y -= delta*50;
				obj.alpha -= .02;
				if (obj.alpha <= 0) Game.screen.removeChild(obj);			
			}

		} 
		
		if (Game.screen2) {
			Game.screen2.x = -Player.sprite.x.toFixed(0)  * Game.screen2.scaleY + Game.width/2  ;
		}
		
		Game.screen.x = -Player.sprite.x.toFixed(0)  * Game.screen.scaleY + Game.width/2  ;
		// 50 worked without jitters
		if (Math.abs(Game.screen.y - Game.ytarget * Game.screen.scaleY) > Game.ycamspeed/50) {
			if (Game.screen.y > Game.ytarget * Game.screen.scaleY) {
				Game.screen.y -= (delta*Game.ycamspeed) * Game.screen.scaleY;
			}
			else {
				Game.screen.y += (delta*Game.ycamspeed) * Game.screen.scaleY;
			
			}
		
		}
		else {
			Game.screen.y = (Game.ytarget * Game.screen.scaleY);		
		}
		
		// don't let player out of screen
		if (-Game.screen.y > Player.sprite.y * Game.screen.scaleY) {

			Game.screen.y = -Player.sprite.y * Game.screen.scaleY;
		}
		else if (-(Game.screen.y - (Game.height - 50)) < Player.sprite.y * Game.screen.scaleY) { 
			Game.screen.y = -Player.sprite.y * Game.screen.scaleY + (Game.height - 50); // 25 = 1/2 player
	
		}
		
		
		if (Player.sprite.y > Game.yterminate) {
			// dead
			
			Game.playSound("death");
			Player.score = Player.bonusScore;
			Game.loadLevel();
		}
		
		Game.stage.update();

	}
}


window.addEventListener('load', function() {
	Game.init();
	$('#open-options').addEventListener('click',function() {
		$('#menu-main').style.display='none';
		$('#menu-options').style.display='block';
	});
	$('#open-main').addEventListener('click',function() {
		$('#menu-main').style.display='block';
		$('#menu-options').style.display='none';
	});

	// touch controls
	var cleft = $('#control-left'), 
		cright = $('#control-right'), 
		cdown = $('#control-down'),
		cup = $('#control-up')
	cup.addEventListener('touchstart', function() {
		Player.jump();
	});
	cleft.addEventListener('touchstart', function() {
		if (!Game.MOVING_LEFT) {
			Player.move(KEY_LEFT);
		}
		Game.MOVING_LEFT = true;		
	});
	cleft.addEventListener('touchend', function() {
		Game.MOVING_LEFT = false;
	});
	cright.addEventListener('touchstart', function() {
		if (!Game.MOVING_RIGHT) {
			Player.move(KEY_RIGHT);
		}
		Game.MOVING_RIGHT = true;		
	});
	cright.addEventListener('touchend', function() {
		Game.MOVING_RIGHT = false;
	});
	cdown.addEventListener('touchstart', function() {
		Game.MOVING_DOWN= true;		
	});
	cdown.addEventListener('touchend', function() {
		Game.MOVING_DOWN = false;
	});


	//options	
	$('#opt-sound').checked = Game.settings.sound;
	$('#opt-sound').addEventListener('change',function(event) {
		Game.updateSetting('sound', this.checked)
	});

	$('#opt-music').checked = Game.settings.music;
	$('#opt-music').addEventListener('change',function(event) {
		Game.updateSetting('music', this.checked)
	});

	$('#opt-touch').checked = Game.settings.touch;
	$('#opt-touch').addEventListener('change',function(event) {
		Game.updateSetting('touch', this.checked)
	});

	$('#opt-effects').checked = Game.settings.efx;
	$('#opt-effects').addEventListener('efx',function(event) {
		Game.updateSetting('efx', this.checked)
	});
})


export default Game;
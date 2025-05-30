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
	MOVING_RIGHT: false, 
	MOVING_LEFT: false, 
	MOVING_DOWN: false,
	CurrentLevel:1,
	Gravity:50,
	Paused:true,
	Goal:0,
	Stage:null,
	Screen:null,
	Screen2:null,
	Width:1000,
	Height:600,
	Ytarget:0,
	Ycamera:0,
	Ycamspeed:800,
	Ycamoffset:420,
	Yterminate:800, // point where player dies, LoadLevel will figure this out dynamically
	Level:null,
	LevelMaps:["100","200","300","400","500","600","700","800","900","1000","portals","secret"],
	Sounds:["bounce","branch","coins","death","door","flap","harp","harp2","key","spring","turbo"],
	Images:["balloon","bonus","branch","coin","exit","fist","head","key","ladder",
			"lava","particle","player_r","player_l","portal","spring","temple","turbo",
			"block1","block2","block3","block4","block5","block6"],
	Music:{
		passages:["passage1","passage2","passage3","passage4","passage5"],
		index:0,
		sound:null,
		preloaded:false
	},
	Debug:false,
	MaxDelta:0, // for debugging
	MinFPS:120, //
	Ticks:0,
	Sky:null,
	Exit:null,
	Bonus:null,
	LoadedBonus:false,
	Temple:null,
	CookieName:"PslInf",
	JustRestored:false,
	Unlock:0,
	UI:{},
	Settings:{
		sound:true,
		music:true,
		efx:true
	},
	useMusic: false,

	Init: function() {
		// https://stackoverflow.com/questions/44828676/preloadjs-not-working-on-angular-createjs-module
		window.createjs = createjs;
		var queue = new createjs.LoadQueue(true);
		createjs.Sound.alternateExtensions = ['mp3']
		queue.installPlugin(createjs.Sound);
		queue.addEventListener('complete', Game.LoadedQueue);
		queue.addEventListener('error', function(e) {console.error(e)} );
		
		//queue.on("complete", Game.LoadedQueue, this);
		queue.on("fileload", function(event) {
			//console.log(event.item);
			if (event.item.type == "image") {
				// not sure what the image preload is really buying us here ??
				// the DOM doesn't get updated so...
				var img = document.createElement("img");
				img.src = event.item.src;

				
			}
		});
		

		for (var i=0; i<Game.Sounds.length; i++) {
			//console.log("loading " + Game.Sounds[i]);
			//createjs.Sound.registerSound("sounds/"+Game.Sounds[i]+".mp3", Game.Sounds[i]);
			var li = new createjs.LoadItem();

			li.src = "/assets/sounds/"+Game.Sounds[i]+".mp3";
			li.id = Game.Sounds[i]+".mp3";

			queue.loadFile(li, false);
		}
		if (Game.useMusic) {
			// we will lazy load the remaining passages
			var li = new createjs.LoadItem();
			
			li.src = "/assets/sounds/"+Game.Music.passages[0]+".mp3";
			li.id = Game.Music.passages[0]+".mp3";
			queue.loadFile(li, false);
		}
		
		for (var i=1; i<Game.Images.length; i++) {
			var li = new createjs.LoadItem();
			li.src = "/assets/images/"+Game.Images[i]+".png";
			li.id = Game.Images[i]+".png";

			queue.loadFile(li, false);	
		
		}
		
		for (var i=1; i<5; i++) {
			var li = new createjs.LoadItem();
			li.src = "/assets/images/sky"+i+".png";
			li.id = "sky"+i+".png";

			queue.loadFile(li, false);	
		
		}

	   
		queue.load(); // handled by LoadedQueue
	
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
					Game.Pause();
					break;
				case KEY_TILDE: 
					Game.Debug = !Game.Debug;
					if (Game.Debug) {
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
		
		
		$('#canvas').width = Game.Width;
		$('#canvas').height = Game.Height;

		createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
		createjs.Ticker.setFPS(30);
		createjs.Ticker.addEventListener("tick", Game.Update);


	},
	
	Pause:function() {
		// not before a level is loaded
		if (Game.Level) { 
			Game.Paused = !Game.Paused;
			if (!Game.Paused) {
				$("#menu").style.display='none';
				if (Game.Music.sound) {
					Game.Music.sound.paused = false;
				}
			}
			else {
				$("#menu").style.display='block';
				if (Game.Music.sound) {
					Game.Music.sound.paused = true;
				}
			}
		}

	},
	
	LoadedQueue: function(event) {
		Game.Stage = new createjs.Stage("canvas");    
		Game.LoadState();
		
		Game.Sky = Put.sky("/assets/images/sky3.png");
		Game.Stage.update();
		
		Game.UI.score = $("#score");
		Game.UI.goal = $("#goal");
		$('#menu-new').addEventListener("click",function() {
			Game.Start(); 
			$("#menu").style.display='none';
		});
		
		$("#loading").style.display='none'; 
		$("#menu").style.display='block'; 
		 
	},
	
	Start: function() {
		Player.score = 0;
		Player.bonusScore = 0;
		if (Game.Unlock > 0) {
			Game.CurrentLevel = 11;
		}
		else {
			Game.CurrentLevel = 1;
		}
		Game.JustRestored = false;
		Game.LoadLevel();
		$("#menu-continue").classList.remove("inactive");
		$("#menu-continue").addEventListener("click", Game.Resume);

		if (Game.Settings.music && Game.useMusic) {
			if (Game.Music.sound) {
				Game.Music.sound.stop(); 
			}
			Game.PlayMusic();
		}
	},
	
		
	Resume: function() {
		Game.JustRestored = false;
		Game.Paused = false;
		if (!Game.Level) {
			Game.LoadLevel();
		}
		if (Game.Settings.music && Game.useMusic) {
			if (Game.Music.sound) {
				Game.Music.sound.paused = false; 
			}
			else {
				Game.PlayMusic();
			}
		}
		$("#menu").style.display = 'none';
	},
	
	LoadState: function() {
		// https://developer.mozilla.org/en-US/docs/Web/API/document/cookie
		var cookieValue = decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + 
			encodeURIComponent(Game.CookieName).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;

		if (cookieValue) {	
			var state = JSON.parse(cookieValue);
		
			//state.level=12;
		
			//console.log(cookieValue);		
			Player.score = state.bonus;
			Player.bonusScore = state.bonus;
			
			Game.CurrentLevel = state.level;
			Game.Unlock = state.unlock;
			Game.Settings.sound = state.sound;
			Game.Settings.music = state.music;
			Game.Settings.efx = state.efx;
			
			
			$("#opt-sound").checked = state.sound;
			$("#opt-music").checked = state.music;
			$("#opt-effects").checked = state.efx;

			if (Game.CurrentLevel > 1) {
				$("#menu-continue").classList.remove("inactive");
				$("#menu-continue").addEventListener("click", Game.Resume);
			}
			
		}		
		Game.JustRestored = true;		
	},
	
	
	SaveState: function() {	
		var cookieValue = '{"level":'+Game.CurrentLevel+
						',"bonus":'+Player.bonusScore+
						',"unlock":'+Game.Unlock+
						',"sound":'+Game.Settings.sound+
						',"music":'+Game.Settings.music+
						',"efx":'+Game.Settings.efx+
						'}';		

		document.cookie = Game.CookieName + "=" + encodeURIComponent(cookieValue) +"; expires=Fri, 31 Dec 9999 23:59:59 GMT";
		
	},
	
	LoadLevel: function() {		
		if (Game.CurrentLevel > Game.LevelMaps.length) {
			Game.Stage = new createjs.Stage("canvas");  
			var lvlDiv = $('#level');
			lvlDiv.fadeIn(0);
			lvlDiv.html("The End");
			lvlDiv.fadeOut(5000);
			return;	
		}
	
	
		var dt = Date.now();
		var map = "/assets/levels/" + Game.LevelMaps[Game.CurrentLevel-1] + ".json?dt=" + dt;
		console.log(map);

		Game.Stage = new createjs.Stage("canvas");	
		Game.Paused = true; // pause until load is complete		
		Game.Goal = 0;	

		fetch(map, {method: 'GET'})
			.then(function(response) { return response.json(); })
			.then(function(json) {
				Game.LoadedLevel(json);
			});	
	},
	
	LoadedLevel: function(data) {
		if (!Game.JustRestored && (!Game.Level || Game.Level.name != data.name)) {
				
			var lvlDiv = $('#level');
			lvlDiv.style.opacity = 1;
			lvlDiv.innerHTML=data.name;
			lvlDiv.style.transition = '5.0s';
			lvlDiv.style.opacity = 0;

			
			var hintDiv = $('#hint');
			hintDiv.style.opacity = 1;
			hintDiv.innerHTML=data.hint;
			hintDiv.style.transition = '5.0s';
			hintDiv.style.opacity = 0;

		}
		
		Game.Level = data;
		if (Game.Level.sky) {
			Game.Sky = Put.sky(Game.Level.sky);
		
		}
		/*
		if (Game.Screen) { // hack to show last level in screen2
			Game.Screen.removeChild(Player.sprite);	
			Game.Screen2 = Game.Screen;
			Game.Screen2.scaleX = .4;
			Game.Screen2.scaleY = .4;
			Game.Stage.addChild(Game.Screen2);
		}
		*/
		Game.Screen = new createjs.Container();
		Game.Stage.addChild(Game.Screen);
		
		if (Game.CurrentLevel >= 9) {
			Game.Screen.scaleX = .7;
			Game.Screen.scaleY = .7;
		}
		
		Game.LoadedBonus = false;
		Player.hasKey = false;
		//Player.hasKey = true; // DEBUG
		$("#key").innerHTML='';
		
		Game.SaveState();
		
		Game.ParseMap(Game.Level.map);		
		Game.Yterminate += 160;
		Game.Ytarget = -(Player.sprite.y) + Game.Ycamoffset;
		Game.Screen.y = -(Player.sprite.y) + Game.Ycamoffset;
		
		if (Game.CurrentLevel == 11) {
			Game.Goal = 300;
		}
		Game.UpdateScore();
		
		if (Game.Level.sky == "/assets/images/sky1.png" || Game.Level.sky == "/assets/images/sky2.png") {
			Game.Lava = Put.lava(0, 550, 255, 0, 0);
		}
		else {
			Game.Lava = Put.lava(0, 550, 255, 180, 0);
		}
		
		if (!Game.JustRestored) {
			Game.Paused = false;
		}

	},
	
	
	LoadBonus:function() {
		// move last screen to 2
		Game.Screen.removeChild(Player.sprite);	
		Game.Screen2 = Game.Screen;	
		
		// load bonus on main screen
		Game.Screen = new createjs.Container();
		Game.Screen.scaleX = .5;
		Game.Screen.scaleY = .5;
		Game.Stage.addChild(Game.Screen);	
		Game.Stage.addChild(Game.Screen2);
		
		var goal = Game.Goal;
		
		Game.ParseMap(Game.Level.bonus);	
		
		// bonus points don't change goal
		Game.Goal = goal;

	},
	
	
	ExitBonus:function() {
		// swap the screens except for the player		
		Game.Screen.removeChild(Player.sprite);		
		Game.Screen2.addChild(Player.sprite);
		
		var temp = Game.Screen;

		Game.Screen = Game.Screen2 ;
		Game.Screen2 = temp;	

		Player.sprite.x = Game.Bonus.Sprite.x;
		Player.sprite.y = Game.Bonus.Sprite.y;
	
	},
	
	ParseMap:function(map) {
	
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
					Game.Bonus = Put.bonus(gameX,gameY);
				}
				else if (current == "e") {
					Put.bonusExit(gameX,gameY);
				}
				else if (current == "n") {
					Game.Exit = Put.exit(gameX,gameY);
				}
				else if (current == "m") {
					Put.entrance(gameX,gameY);
				}
				else if (current == "g") {
					Put.guard(gameX,gameY);
				}
				else if (current == "t") {
					Game.Temple = Put.temple(gameX,gameY);
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
						b.Waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY+300}];
					} 
					else if (current == "^") {
						b.Waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY-300}];				
					}
					else if (current == "<") {
						b.Waypoints=[{x:gameX,y:gameY},{x:gameX-400,y:gameY}];				
					}
					else if (current==">") {
						b.Waypoints=[{x:gameX,y:gameY},{x:gameX+400,y:gameY}];	
					}
					else if (current=="L") {
						b.Waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY-300},{x:gameX,y:gameY},{x:gameX+400,y:gameY}];	
					}
					else if (current=="T") {
						b.Waypoints=[{x:gameX,y:gameY},{x:gameX,y:gameY+300},{x:gameX,y:gameY},{x:gameX-400,y:gameY}];	
					
					}
				
				}
				
				if (gameY > Game.Yterminate) {
					Game.Yterminate = gameY; 
				}
				
			}
			
		
		} // end map iteration
	
		Player.init(px,py);
	
	},
	
	PlaySound:function(sound) {
		if (Game.Settings.sound) {
			createjs.Sound.play(sound + ".mp3");
		}
	},
	
	PlayMusic:function() {
		Game.Music.sound = createjs.Sound.play(Game.Music.passages[Game.Music.index]  + ".mp3");	

		if (Game.Music.index + 1 < Game.Music.passages.length && !Game.Music.preloaded) {
			var psg = Game.Music.passages[Game.Music.index + 1];
			createjs.Sound.registerSound("/assets/sounds/"+psg+".mp3", psg+".mp3");
		}

		
		Game.Music.sound.on("complete",function() {

			Game.Music.index++;
			if (Game.Music.index == Game.Music.passages.length) {
				Game.Music.index = 0;
				Game.Music.preloaded = true;
			}

			Game.PlayMusic() ;
		});
	},
	
	UpdateSetting:function(setting, state) {
		switch(setting) {
			case "music":
				if (Game.Music.sound && !state) {
					Game.Music.sound.stop();
					Game.Music.sound = null;
				}
				else {
					Game.PlayMusic();	
					Game.Music.sound.paused = true;
				}
				Game.Settings.music = state;
				break;
			case "sound":
				Game.Settings.sound = state;
				break;
			case "efx":
				Game.Settings.efx = state;
				break;
		}
		
		
		Game.SaveState();
		
	},
	
	UpdateScore:function() {		
		Game.UI.score.innerHTML=Player.score
		Game.UI.goal.innerHTML = Game.Goal;
		if (Player.score < Game.Goal) {
			Game.UI.goal.style.color= "red";
		}
		else if (Player.score == Game.Goal) {
			Game.UI.goal.style.color= "white";
			console.log("Game.UI.goal.style.color=" + Game.UI.goal.style.color)
			if (Game.Exit) Game.Exit.Sprite.gotoAndStop(1);
			
			Game.PlaySound("door");
		}
	},
	
	Update:function(event) {

		var delta = event.delta/1000;
		Game.Ticks++;
	
		if (Game.Debug) {
			var fps = createjs.Ticker.getMeasuredFPS().toFixed(1);
			if (fps < Game.MinFPS) {
				Game.MinFPS = fps;
			}
		
			if (delta > Game.MaxDelta) {
				Game.MaxDelta = delta;
			}	
		/*
			$("#debug").html("FPS: "+fps
				+"<br />Min FPS: "+ Game.MinFPS
				+"<br />Delta: "+delta.toFixed(3) 
				+"<br />Max Delta: "+ Game.MaxDelta.toFixed(3) 
				+"<br />Player: " + Player.sprite.x.toFixed(1) +"," + Player.sprite.y.toFixed(1)
				+"<br />Screen: " + Game.Screen.x.toFixed(1) +"," + Game.Screen.y.toFixed(1) 
				+"<br />Objects: "+Game.Screen.children.length);
			*/
		}
	
		if (Game.Paused) {
			return;
		}
	
		if (delta > .08) {
			delta = .08; // avoid too big of a step with dip in fps
		}
		Player.update(delta);
		
		Game.Sky.Update(delta);

		if (Game.Settings.efx && Game.Lava) {
			Game.Lava.Update(delta);
		}
		
		for(var i=0; i<Game.Screen.children.length; i++) {
			var obj = Game.Screen.children[i];
			if(obj.UserData && typeof obj.UserData.Update === "function") {
				obj.UserData.Update(delta);
			}
			else if (obj.name == "points") {
				obj.y -= delta*50;
				obj.alpha -= .02;
				if (obj.alpha <= 0) Game.Screen.removeChild(obj);			
			}

		} 
		
		if (Game.Screen2) {
			Game.Screen2.x = -Player.sprite.x.toFixed(0)  * Game.Screen2.scaleY + Game.Width/2  ;
		}
		
		Game.Screen.x = -Player.sprite.x.toFixed(0)  * Game.Screen.scaleY + Game.Width/2  ;
		// 50 worked without jitters
		if (Math.abs(Game.Screen.y - Game.Ytarget * Game.Screen.scaleY) > Game.Ycamspeed/50) {
			if (Game.Screen.y > Game.Ytarget * Game.Screen.scaleY) {
				Game.Screen.y -= (delta*Game.Ycamspeed) * Game.Screen.scaleY;
			}
			else {
				Game.Screen.y += (delta*Game.Ycamspeed) * Game.Screen.scaleY;
			
			}
		
		}
		else {
			Game.Screen.y = (Game.Ytarget * Game.Screen.scaleY);		
		}
		
		// don't let player out of screen
		if (-Game.Screen.y > Player.sprite.y * Game.Screen.scaleY) {

			Game.Screen.y = -Player.sprite.y * Game.Screen.scaleY;
		}
		else if (-(Game.Screen.y - (Game.Height - 50)) < Player.sprite.y * Game.Screen.scaleY) { 
			Game.Screen.y = -Player.sprite.y * Game.Screen.scaleY + (Game.Height - 50); // 25 = 1/2 player
	
		}
		
		
		if (Player.sprite.y > Game.Yterminate) {
			// dead
			
			Game.PlaySound("death");
			Player.score = Player.bonusScore;
			Game.LoadLevel();
		}
		
		Game.Stage.update();

	}
}


window.addEventListener('load', function() {
	Game.Init();
	$('#open-options').addEventListener('click',function() {
		$('#menu-main').style.display='none';
		$('#menu-options').style.display='block';
	});
	$('#open-main').addEventListener('click',function() {
		$('#menu-main').style.display='block';
		$('#menu-options').style.display='none';
	});
})


export default Game;
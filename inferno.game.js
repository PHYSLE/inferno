/* ---------------------------

Copyright © 2007 - 2017 PHYSLE
All rights reserved.

--------------------------- */


var KEY_LEFT = 37,
	KEY_RIGHT = 39,
	KEY_UP = 38, 
	KEY_DOWN = 40, 
	KEY_SPACE = 32,
	KEY_TILDE = 192,
	KEY_ESCAPE = 27,
	MOVING_RIGHT = false, 
	MOVING_LEFT = false, 
	MOVING_DOWN = false;

//http://createjs.com/docs

var Game = {
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
	Sounds:["bounce","branch","coins","death","door","flap","harp","harp2","key","music-7","spring","turbo"],
	Images:["balloon","blocks","bonus","branch","coin","exit","fist","head","key","ladder",
				"lava","particle","player_r","player_l","portal","spring","temple","turbo"],
	Debug:false,
	MaxDelta:0, // for debugging
	MinFPS:120, //
	Ticks:0,
	Sky:null,
	Exit:null,
	Bonus:null,
	LoadedBonus:false,
	Temple:null,
	Music:null,
	CookieName:"PslInf",
	JustRestored:false,
	Unlock:0,
	UI:{},
	Settings:{
		sound:true,
		music:true,
		efx:true
	},
	
	Init: function() {
	
		var queue = new createjs.LoadQueue(true);
		queue.installPlugin(createjs.Sound);
		queue.on("complete", Game.LoadedQueue, this);
		queue.on("fileload", function(event) {
			if (event.item.type == "image") {
				// not sure what the image preload is really buying us here ??
				// the DOM doesn't get updated so...
				var img = document.createElement("img");
				img.src = event.item.src;

				//console.log(event.item);
			}
		});


		for (var i=0; i<Game.Sounds.length; i++) {
			//console.log("loading " + Game.Sounds[i]);
			//createjs.Sound.registerSound("sounds/"+Game.Sounds[i]+".mp3", Game.Sounds[i]);
			var li = new createjs.LoadItem();

			li.src = "sounds/"+Game.Sounds[i]+".mp3";
			li.id = Game.Sounds[i]+".mp3";

			queue.loadFile(li, false);

		}
		
		for (var i=1; i<Game.Images.length; i++) {
			var li = new createjs.LoadItem();
			li.src = "images/"+Game.Images[i]+".png";
			li.id = Game.Images[i]+".png";

			queue.loadFile(li, false);	
		
		}
		
		for (var i=1; i<5; i++) {
			var li = new createjs.LoadItem();
			li.src = "images/sky"+i+".png";
			li.id = "sky"+i+".png";

			queue.loadFile(li, false);	
		
		}

	   
		queue.load(); // handled by LoadedQueue
	
		document.onkeydown = function (event) {
			switch(event.keyCode) {
				case KEY_LEFT:	
					if (!MOVING_LEFT) {
						// don't reanimate when holding down l/r
						Player.Move(KEY_LEFT);
					}
					MOVING_LEFT = true;
					break;
				case KEY_RIGHT: 
					if (!MOVING_RIGHT) {
						// don't reanimate when holding down l/r
						Player.Move(KEY_RIGHT);
					}
					MOVING_RIGHT = true;
					break;
				case KEY_UP: 
					Player.Jump();
					break;
				case KEY_DOWN: 
					MOVING_DOWN = true;
					break;
				case KEY_SPACE: 
					Player.Jump();
					break;
				case KEY_ESCAPE: 
					Game.Pause();
					break;
				case KEY_TILDE: 
					Game.Debug = !Game.Debug;
					if (Game.Debug) {
						$("#debug").show();
					}
					else {
						$("#debug").hide();
					}
					break;
			}
		}

		document.onkeyup = function (event) {
			switch(event.keyCode) {
				case KEY_LEFT:	
					MOVING_LEFT = false;
					break;
				case KEY_RIGHT: 
					MOVING_RIGHT = false;
					break;
				case KEY_DOWN: 
					MOVING_DOWN = false;
					break;
			}
		}
		
		
		$('#canvas').attr('width',Game.Width);
		$('#canvas').attr('height',Game.Height);

		createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
		createjs.Ticker.setFPS(30);
		createjs.Ticker.addEventListener("tick", Game.Update);

	},
	
	Pause:function() {
		// not before a level is loaded
		if (Game.Level) { 
			Game.Paused = !Game.Paused;
			if (!Game.Paused) {
				$("#menu").hide();
				if (Game.Music) {
					Game.Music.paused = false;
				}
			}
			else {
				$("#menu").show();
				if (Game.Music) {
					Game.Music.paused = true;
				}
			}
		}

	},
	
	LoadedQueue: function(event) {
		Game.Stage = new createjs.Stage("canvas");    
		Game.LoadState();
		
		Game.Sky = Put.Sky("images/sky3.png");
		Game.Stage.update();
		
		Game.UI.score = $("#score");
		Game.UI.goal = $("#score small");
		
		$("#loading").hide(); 
		$("#menu").show(); 
		 
	},
	
	Start: function() {
		Player.Score = 0;
		Player.BonusScore = 0;
		if (Game.Unlock > 0) {
			Game.CurrentLevel = 11;
		}
		else {
			Game.CurrentLevel = 1;
		}
		Game.JustRestored = false;
		Game.LoadLevel();
		$("#menu-continue").removeClass("inactive");
		$("#menu-continue").attr("href","#");
		$("#menu-continue").click(Game.Resume);
		if (Game.Settings.music) {
			if (Game.Music) {
				Game.Music.stop(); 
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
		if (Game.Settings.music) {
			if (Game.Music) {
				Game.Music.paused = false; 
			}
			else {
				Game.PlayMusic();
			}
		}
		$("#menu").hide();
	},
	
	LoadState: function() {
		// https://developer.mozilla.org/en-US/docs/Web/API/document/cookie
		var cookieValue = decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + 
			encodeURIComponent(Game.CookieName).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;

		if (cookieValue) {	
			var state = JSON.parse(cookieValue);
		
			//state.level=12;
		
			//console.log(cookieValue);		
			Player.Score = state.bonus;
			Player.BonusScore = state.bonus;
			
			Game.CurrentLevel = state.level;
			Game.Unlock = state.unlock;
			Game.Settings.sound = state.sound;
			Game.Settings.music = state.music;
			Game.Settings.efx = state.efx;
			
			
			$("#opt-sound").prop( "checked", state.sound);
			$("#opt-music").prop( "checked", state.music);
			$("opt-effects").prop( "checked", state.efx);

			if (Game.CurrentLevel > 1) {
				$("#menu-continue").removeClass("inactive");
				$("#menu-continue").attr("href","#");
				$("#menu-continue").click(Game.Resume);
			}
			
		}
		
		Game.JustRestored = true;		
	},
	
	
	SaveState: function() {	
		var cookieValue = '{"level":'+Game.CurrentLevel+
						',"bonus":'+Player.BonusScore+
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
		var map = "levels/" + Game.LevelMaps[Game.CurrentLevel-1] + ".js?dt=" + dt;
		//console.log(map);

		Game.Stage = new createjs.Stage("canvas");	
		Game.Paused = true; // pause until load is complete		
		Game.Goal = 0;	
		
		$.ajax({
			url:map,
			dataType:"json",
			success: function(data) {
			
				//console.log(data);
				Game.LoadedLevel(data);
			}
		});	
	},
	
	LoadedLevel: function(data) {

		
		if (!Game.JustRestored && (!Game.Level || Game.Level.name != data.name)) {
				
			var lvlDiv = $('#level');
			lvlDiv.fadeIn(0);
			lvlDiv.html(data.name);
			lvlDiv.fadeOut(5000);	
			
			var hintDiv = $('#hint');
			hintDiv.fadeIn(0);
			hintDiv.html(data.hint);
			hintDiv.fadeOut(5000);	
			//console.log(data.hint);
		}

		Game.Level = data;
		if (Game.Level.sky) {
			Game.Sky = Put.Sky(Game.Level.sky);
		
		}
		/*
		if (Game.Screen) { // hack to show last level in screen2
			Game.Screen.removeChild(Player.Sprite);	
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
		Player.HasKey = false;
		//Player.HasKey = true; // DEBUG
		$("#key").html("");
		
		Game.SaveState();
		
		Game.ParseMap(Game.Level.map);		
		Game.Yterminate += 160;
		Game.Ytarget = -(Player.Sprite.y) + Game.Ycamoffset;
		Game.Screen.y = -(Player.Sprite.y) + Game.Ycamoffset;
		
		if (Game.CurrentLevel == 11) {
			Game.Goal = 300;
		}
		Game.UpdateScore();
		
		if (Game.Level.sky == "images/sky1.png" || Game.Level.sky == "images/sky2.png") {
			Game.Lava = Put.Lava(0, 550, 255, 0, 0);
		}
		else {
			Game.Lava = Put.Lava(0, 550, 255, 180, 0);
		}
		
		if (!Game.JustRestored) {
			Game.Paused = false;
		}
	},
	
	
	LoadBonus:function() {
		// move last screen to 2
		Game.Screen.removeChild(Player.Sprite);	
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
		Game.Screen.removeChild(Player.Sprite);		
		Game.Screen2.addChild(Player.Sprite);
		
		var temp = Game.Screen;

		Game.Screen = Game.Screen2 ;
		Game.Screen2 = temp;	

		Player.Sprite.x = Game.Bonus.Sprite.x;
		Player.Sprite.y = Game.Bonus.Sprite.y;
	
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
					Put.Coin(gameX+15,gameY);
				}
				else if (current == "#") {
					Put.Ladder(gameX,gameY);
				}
				else if (current == "z") {
					Put.Spring(gameX,gameY);
				}
				else if (current == "w") {
					Put.Turbo(gameX,gameY);
				}
				else if (current == "@") {
					Put.Balloon(gameX,gameY);
				}
				else if (current == "-") {
					Put.Branch(gameX,gameY);
				}
				else if (current == "?") {
					Put.Key(gameX,gameY);
				}
				else if (current == "b") {
					Game.Bonus = Put.Bonus(gameX,gameY);
				}
				else if (current == "e") {
					Put.BonusExit(gameX,gameY);
				}
				else if (current == "n") {
					Game.Exit = Put.Exit(gameX,gameY);
				}
				else if (current == "m") {
					Put.Entrance(gameX,gameY);
				}
				else if (current == "g") {
					Put.Guard(gameX,gameY);
				}
				else if (current == "t") {
					Game.Temple = Put.Temple(gameX,gameY);
				}
				else if (/^\d$/.test(current)) {
					Put.Portal(gameX,gameY,current);
				}
				else if (isBlock(current)) {
					var prior = x > 0 ? map[y][x-1]:null;
					if (isBlock(prior)) {
						continue; // if the prior is block it should already be put
					}
					
					// rather than looking forward and back 1, build all next blocks in one go
					var n=0;
					while (map[y].length > x+n && isBlock(map[y][x+n])) {
						n++;
					}
					/*
					var next = map[y].length > x+1 ? map[y][x+1]:null;
					var n = 0;
					if (isBlock(prior) && isBlock(next)) {
						n = 2;
					}
					else if (isBlock(prior)) {
						n = 3;
					}
					else if (isBlock(next)) {
						n = 1;
					}
					*/
					var b = Put.Block(gameX,gameY,n);

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
	
		Player.Init(px,py);
	
	},
	
	PlaySound:function(sound) {
		if (Game.Settings.sound) {
			createjs.Sound.play(sound + ".mp3");
		}
	},
	
	PlayMusic:function() {
		Game.Music = createjs.Sound.play("music-7.mp3");	
		Game.Music.on("complete",function() {
			PlayMusic() ;
		});
	},
	
	UpdateSetting:function(setting, state) {
		switch(setting) {
			case "music":
				if (Game.Music && !state) {
					Game.Music.stop();
					Game.Music = null;
				}
				else {
					Game.PlayMusic();	
					Game.Music.paused = true;
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
		Game.UI.score.html(Player.Score + "<small>" + Game.Goal + "</small>");
		Game.UI.goal.css("color", "red");
		
		if (Player.Score == Game.Goal) {
			Game.UI.goal.css("color", "white");
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
		
			$("#debug").html("FPS: "+fps
				+"<br />Min FPS: "+ Game.MinFPS
				+"<br />Delta: "+delta.toFixed(3) 
				+"<br />Max Delta: "+ Game.MaxDelta.toFixed(3) 
				+"<br />Player: " + Player.Sprite.x.toFixed(1) +"," + Player.Sprite.y.toFixed(1)
				+"<br />Screen: " + Game.Screen.x.toFixed(1) +"," + Game.Screen.y.toFixed(1) 
				+"<br />Objects: "+Game.Screen.children.length);
		}
	
		if (Game.Paused) {
			return;
		}
	
		if (delta > .08) {
			delta = .08; // avoid too big of a step with dip in fps
		}
		Player.Update(delta);
		
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
			Game.Screen2.x = -Player.Sprite.x.toFixed(0)  * Game.Screen2.scaleY + Game.Width/2  ;
		}
		
		Game.Screen.x = -Player.Sprite.x.toFixed(0)  * Game.Screen.scaleY + Game.Width/2  ;
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
		if (-Game.Screen.y > Player.Sprite.y * Game.Screen.scaleY) {

			Game.Screen.y = -Player.Sprite.y * Game.Screen.scaleY;
		}
		else if (-(Game.Screen.y - (Game.Height - 50)) < Player.Sprite.y * Game.Screen.scaleY) { 
			Game.Screen.y = -Player.Sprite.y * Game.Screen.scaleY + (Game.Height - 50); // 25 = 1/2 player
	
		}
		
		
		if (Player.Sprite.y > Game.Yterminate) {
			// dead
			
			Game.PlaySound("death");
			Player.Score = Player.BonusScore;
			Game.LoadLevel();
		}
		
		Game.Stage.update();

	}
}

var Player = {
	// must be multiples of Game.Gravity 
	Score: 0,
	BonusScore: 0,
	JumpVelocity: Game.Gravity * 12,//from 15
	BounceVelocity: Game.Gravity * 8,//from 10
	DriftVelocity:260,//from 300
	GPunch:0,
	GForce:0,
	Jumps:2,
	Jumping:false,
	Sprite:null,
	LastMove:MOVING_RIGHT,
	MaxG:1800,
	HasKey:false,
	SpriteSheet:new createjs.SpriteSheet({
		images: ["images/player_r.png","images/player_l.png"],
		frames: {width:50, height:75},
		animations: {
			jump_r:{frames:[0,5], next: false ,speed: 0.6},
			fall_r:{frames: [5,4,3,2,1,0], next: false ,speed: 0.6},
			bounce_r:{frames: [1,2], next: false, speed: 0.6},
			bounce2_r:{frames: [2,1], next: false, speed: 0.6},
			jump_l:{frames:[6,7,8,9,10,11], next: false, speed: 0.6},
			fall_l:{frames: [11,10,9,8,7,6], next: false, speed: 0.6},
			bounce_l:{frames: [6.7,8], next: false, speed: 0.6},
			bounce2_l:{frames: [8,7,6], next: false, speed: 0.6}
		}
	}),
	Init:function(x,y) {
		Player.Sprite = new createjs.Sprite(Player.SpriteSheet);
		Player.Sprite.x=x;
		Player.Sprite.y=y;
		Player.GForce = 0;
		Player.GPunch = 0;
		Player.Jumps = 2;
		Player.Jumping = false;
		Game.Screen.addChild(Player.Sprite);
	},
	Update:function(delta) {
		Player.Sprite.y += delta*Player.GForce;
		if (Player.GForce < Player.MaxG) {
			Player.GForce += Game.Gravity;
		}
		
		Player.Sprite.x += delta*Player.GPunch;
		if (Player.GPunch > 0) {
			Player.GPunch -= 10;
		}
		else if (Player.GPunch < 0) {
			Player.GPunch += 10;
		}
		
		if (Player.GForce == 0) {
			if (Player.Jumping) {
				if (Player.LastMove == KEY_LEFT) {
					Player.Sprite.gotoAndPlay("fall_l");
				}
				else {
					Player.Sprite.gotoAndPlay("fall_r");
				}
			}
			else {
				if (Player.LastMove == KEY_LEFT) {
					Player.Sprite.gotoAndPlay("bounce2_l");
				}
				else {
					Player.Sprite.gotoAndPlay("bounce2_r");
				}	
			}
		}
		if (MOVING_LEFT) {
			Player.Sprite.x -= delta*Player.DriftVelocity;
		}
		if (MOVING_RIGHT) {
			Player.Sprite.x += delta*Player.DriftVelocity;
		}		
	},
	Bounce:function() {
		Player.GForce = -Player.BounceVelocity;	
		Player.Jumping = false;
		Player.Jumps = 2;
		Game.Ytarget = -(Player.Sprite.y) + Game.Ycamoffset;
		if (Player.LastMove == KEY_LEFT) {
			Player.Sprite.gotoAndPlay("bounce_l");
		}
		else  {
			Player.Sprite.gotoAndPlay("bounce_r");
		}
	},
	Jump:function() {
	
		if( Player.GForce > -Player.JumpVelocity && Player.Jumps >0) {
			Player.GForce = -Player.JumpVelocity;
			Player.Jumping = true;
			Player.Jumps--;
			if (Player.LastMove == KEY_LEFT) {
				Player.Sprite.gotoAndPlay("jump_l");
			}
			else {
				Player.Sprite.gotoAndPlay("jump_r");
			}
			Game.PlaySound("flap");
		}	
	},
	Move:function(direction) {
		Player.LastMove = direction;
		// todo - can we start at the frame we were on in the opposite animation?			
		// var i = Player.Sprite.currentFrame;

		if (Player.Jumping) {
			if (Player.LastMove == KEY_LEFT) {
				if (Player.GForce > 0) {
					Player.Sprite.gotoAndPlay("fall_l");				
				}
				else {
					Player.Sprite.gotoAndPlay("jump_l");
				}
			}
			else {
				if (Player.GForce > 0) {
					Player.Sprite.gotoAndPlay("fall_r");				
				}
				else {
					Player.Sprite.gotoAndPlay("jump_r");
				}
			}		
		}
		else {
			if (Player.LastMove == KEY_LEFT) {
				Player.Sprite.gotoAndPlay("bounce_l");
			}
			else  {
				Player.Sprite.gotoAndPlay("bounce_r");
			}			
		}
		
	}
}

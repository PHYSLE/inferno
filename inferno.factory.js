/* ---------------------------

Copyright © 2007 - 2017 PHYSLE
All rights reserved.

--------------------------- */

var Put={
	Balloon: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/balloon.png"]
			,frames: {width:30, height:40}
		});
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			FloatVelocity:0,
			FloatMax:12,
			Update:function(delta) {
				if (this.Sprite.x < Player.Sprite.x + 35 && 
					this.Sprite.x + 25 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 &&
					this.Sprite.y  > Player.Sprite.y) {
					
					Game.PlaySound("bounce");
					
					this.Sprite.y+=20;
					Player.Bounce();
					Player.GForce = -(Player.BounceVelocity * 2);	
					this.FloatVelocity = -60;
					
				}
				if (this.FloatVelocity < this.FloatMax) {
					this.FloatVelocity++;
				}
				this.Sprite.y -= delta*this.FloatVelocity;
			}
		}
		
		obj.Sprite.x=x;
		obj.Sprite.y=y+30;
		obj.Sprite.UserData = obj;
		Game.Screen.addChild(obj.Sprite);

		return obj;
	},
	
	Bonus: function(x,y) {
		var SpriteSheet= new createjs.SpriteSheet({
			images: ["images/bonus.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {			
			Sprite:new createjs.Sprite(SpriteSheet),
			Update:function(delta) {
				if(	Player.HasKey &&
					this.Sprite.x < Player.Sprite.x + 50 && 
					this.Sprite.x + 25 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && 
					this.Sprite.y  > Player.Sprite.y) {
						if (!Game.LoadedBonus) {
							Game.PlaySound("door");
							Game.LoadBonus();
						}
						Game.LoadedBonus = true;
						this.Sprite.gotoAndStop(1);
				}
			}
		};

		obj.Sprite.gotoAndStop(Game.LoadedBonus?1:0);

		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
	
		Game.Screen.addChild(obj.Sprite);
		return obj;
	},


	BonusExit: function(x,y) {
		var SpriteSheet= new createjs.SpriteSheet({
			images: ["images/bonus.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {			
			Sprite:new createjs.Sprite(SpriteSheet),
			Glow:null,
			Update:function(delta) {
				if(	Player.HasKey &&
					this.Sprite.x < Player.Sprite.x + 50 && 
					this.Sprite.x + 25 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && 
					this.Sprite.y  > Player.Sprite.y) {
					Game.ExitBonus();
					
					Game.PlaySound("harp");
				}
			}
		};

		obj.Sprite.gotoAndStop(1);
		
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
	
		Game.Screen.addChild(obj.Sprite);
		return obj;
	},

	Block: function(x,y,i)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/block" + i + ".png"],
			frames: {width:30 * i, height:30}
		});
		
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Waypoints:[],
			WaypointTarget:1,
			Width:30 * i,
			Speed:100,
			Update:function(delta) {
				if (this.Sprite.x < Player.Sprite.x + 35 && 
					(this.Sprite.x + this.Width) - 5 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 &&
					this.Sprite.y  > Player.Sprite.y) {
					Player.Bounce();
				}
				
				if (this.Waypoints && this.Waypoints.length > 0) {
					var i = this.WaypointTarget % this.Waypoints.length;					
					var xd = Math.abs(this.Sprite.x - this.Waypoints[i].x);
					var yd = Math.abs(this.Sprite.y - this.Waypoints[i].y);

					if (xd <= delta*this.Speed && yd <= delta*this.Speed) {
						// arrived
						this.Sprite.x = this.Waypoints[i].x;
						this.Sprite.y = this.Waypoints[i].y;
						this.WaypointTarget++;
					}
					else {
						if (this.Sprite.x < this.Waypoints[i].x) {
							this.Sprite.x += delta*this.Speed;
						}
						else if (this.Sprite.x > this.Waypoints[i].x) {
							this.Sprite.x -= delta*this.Speed;
						}
					
						if (this.Sprite.y < this.Waypoints[i].y) {
							this.Sprite.y += delta*this.Speed;
						}
						else if (this.Sprite.y > this.Waypoints[i].y) {
							this.Sprite.y -= delta*this.Speed;
						}			
					}
				}
			}
		}

		obj.Sprite.gotoAndStop(i);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
		
		Game.Screen.addChild(obj.Sprite);
		return obj;
	},	

	Branch: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/branch.png"],
			frames: {width:60, height:60},
			animations: {break:{frames:[1,2,3,4,5], next: false, speed:.8 }}
		});
		var obj = {
			Broken:false,
			GForce:0,
			Sprite:new createjs.Sprite(SpriteSheet),
			Update:function(delta) {
			
				if (this.Broken) {
					this.GForce += Game.Gravity;
					this.Sprite.y += delta*this.GForce;
					this.Sprite.alpha -= .02;
					
					//@TODO- remove the obj after yterminate
				
				}
			
				if (!this.Broken &&
					this.Sprite.x < Player.Sprite.x + 40 && 
					this.Sprite.x + 40 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 &&
					this.Sprite.y  > Player.Sprite.y) {
					
					Game.PlaySound("branch");
					this.Sprite.gotoAndPlay("branch");
					this.Broken = true;

					Player.Bounce();				
				}
				
			}
		}
		
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
		
		
		Game.Screen.addChild(obj.Sprite);
		
		obj.Sprite.gotoAndStop(0);

		return obj;
	},	
	
	Coin: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/coin.png"],
			frames: {width:24, height:24}
		});	
	
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Glow:Put.Particle(x-23, y-15, 255, 185, 100),
			Expanding:false,
			Update:function(delta) {
				if (this.Expanding) {
					this.Sprite.scaleX += .04;
					this.Sprite.regX = (this.Sprite.scaleX * 12);
					if (this.Sprite.scaleX >= 1.0) {
						this.Expanding = false;
					}
				}
				else {
					this.Sprite.scaleX -= .04;
					this.Sprite.regX = (this.Sprite.scaleX * 12);
					if (this.Sprite.scaleX <= .1) {
						this.Expanding = true;
					}
				}
				if (this.Sprite.x < Player.Sprite.x + 50 && 
					this.Sprite.x + 12 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && 
					this.Sprite.y  > Player.Sprite.y) {

					Game.PlaySound("coins");
					
					var text = new createjs.Text("10", "20px InfernoFont", "#f0be00");
					text.x = this.Sprite.x-6;
					text.y = this.Sprite.y+12;
					text.textBaseline = "alphabetic";
					text.name = "points";

					Game.Screen.addChild(text);

					Game.Screen.removeChild(this.Sprite);	
					if (this.Glow) {	 
						Game.Screen.removeChild(this.Glow.Sprite);
					}

					Player.Score+=10;
					Game.UpdateScore();
					
				}
			}
		};

		obj.Sprite.gotoAndPlay(0);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
		
		Game.Screen.addChild(obj.Sprite);
		Game.Goal+=10;
		
		return obj;
	},	
	

	
	
	Entrance: function(x,y) {
		var SpriteSheet= new createjs.SpriteSheet({
			images: ["images/exit.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
		};
	
		obj.Sprite.gotoAndStop(1);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
	
		Game.Screen.addChild(obj.Sprite);
		return obj;
	},
	
	Exit: function(x,y) {
		var SpriteSheet= new createjs.SpriteSheet({
			images: ["images/exit.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Update:function(delta) {
				if(	Player.Score >= Game.Goal &&
					this.Sprite.x < Player.Sprite.x + 50 && 
					this.Sprite.x + 25 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && 
					this.Sprite.y  > Player.Sprite.y) {
					
					Game.PlaySound("harp2");
					Player.Score -= Game.Goal;
					// save bonus
					Player.BonusScore = Player.Score;
					Game.CurrentLevel++;
					Game.LoadLevel();
				}
			}
		};
	
		obj.Sprite = new createjs.Sprite(SpriteSheet);
		obj.Sprite.gotoAndStop(0);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
	
		Game.Screen.addChild(obj.Sprite);
		return obj;
	},

	Fist: function(x, y, rl) {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/fist.png"],
			frames: {width:30, height:30}
		});	
		
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			InitX:x,
			InitY:y,
			Facing:0,
			Side:rl,
			Update:function(delta) {
				if (this.Side == 'r') {
					this.Facing += .13;
				}
				else {
					this.Facing -= .13;
				}
				
				
				this.Sprite.x = this.InitX + (Math.cos(this.Facing) * 100);
				this.Sprite.y = this.InitY + (Math.sin(this.Facing) * 100);
				
				
				if (this.Sprite.x < Player.Sprite.x + 50 && 
					this.Sprite.x + 15 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && 
					this.Sprite.y  > Player.Sprite.y) {
					
					
					Game.PlaySound("bounce");
					//console.log("Punched in the face!");
					
					if (this.Side == 'r') {
						Player.GPunch = 1000;
					}
					else {
						Player.GPunch = -1000;
					}
				}
			}
		}
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
		if (rl == 'r') {
			obj.Sprite.gotoAndStop(1);
		}
		else {
			obj.Sprite.gotoAndStop(0);
		
		}
		
		Game.Screen.addChild(obj.Sprite);
		
		return obj;
	},

	Guard: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/head.png"],
			frames: {width:36, height:33}
		});	
	
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Lefty:Put.Fist(x-115, y-30, 'l'),
			Lefty2:Put.Fist(x-115, y+30, 'l'),
			Righty:Put.Fist(x+115, y-30, 'r'),
			Righty2:Put.Fist(x+115, y+30, 'r'),
			Glow:Put.Particle(x-20, y-24, 255, 185, 100),
			Update:function(delta) {

				if (this.Sprite.x < Player.Sprite.x + 50 && 
					this.Sprite.x + 12 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && 
					this.Sprite.y  > Player.Sprite.y) {

					var text = new createjs.Text("100", "20px InfernoFont", "#f0be00");
					text.x = this.Sprite.x-6;
					text.y = this.Sprite.y+12;
					text.textBaseline = "alphabetic";
					text.name = "points";
					
					Game.PlaySound("coins");

					Game.Screen.addChild(text);

					Game.Screen.removeChild(this.Sprite);		 
					Game.Screen.removeChild(this.Lefty.Sprite);	 
					Game.Screen.removeChild(this.Righty.Sprite);
					Game.Screen.removeChild(this.Lefty2.Sprite);	 
					Game.Screen.removeChild(this.Righty2.Sprite);
					if (this.Glow) {						 
						Game.Screen.removeChild(this.Glow.Sprite);	
					}

					Game.Temple.UnlockSlot();
					
					Player.Score+=100;
					
					Player.Bounce();
					
					Game.UpdateScore();

					
				}
			}
		};
		if (obj.Glow) {
			obj.Glow.Sprite.scaleX = 1.6;	
			obj.Glow.Sprite.scaleY = 1.6;
		}
		obj.Sprite.gotoAndPlay(0);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
		obj.Righty2.Facing = 1.3;
		obj.Lefty2.Facing = 1.3;
		
		Game.Screen.addChild(obj.Sprite);
		Game.Goal+=100;
		
		return obj;
	},

	Key: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/key.png"],
			frames: {width:20, height:47}
		});	
	
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Glow:Put.Particle(x-15, y-15, 255, 185, 100),
			Update:function(delta) {
				if (this.Sprite.x < Player.Sprite.x + 50 && 
					this.Sprite.x + 12 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && 
					this.Sprite.y  > Player.Sprite.y) {

					Game.PlaySound("key");


					Game.Screen.removeChild(this.Sprite);		
					if (this.Glow) {	 
						Game.Screen.removeChild(this.Glow.Sprite);
					}
					Player.HasKey = true;
					//$("#key").html("&#9911;");
					$("#key").html('<img src="images/icon-key.png" />');

					
				}
			}
		};

		obj.Sprite.gotoAndPlay(0);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
		
		Game.Screen.addChild(obj.Sprite);

		return obj;
	},
	
	Ladder: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/ladder.png"]
			,frames: {width:30, height:60}
		});
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Update:function(delta) {
				if (this.Sprite.x+16 < Player.Sprite.x + 50 && 
					this.Sprite.x+16 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 50 && // allow going down
					this.Sprite.y > Player.Sprite.y) {
					if (MOVING_DOWN) {
						Player.GForce=500;
					}
					else {
						Player.GForce=-500;			
					}	

				}
			}
		}
		
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;
		
		Game.Screen.addChild(obj.Sprite);

		return obj;
	},	
	
	Lava:function(x,y,r,g,b)  {
		if (!Game.Settings.efx) {
			return null;
		}

		var	SpriteSheet = new createjs.SpriteSheet({
			images: ["images/lava.png"],
			frames: {width:5, height:100}
		});

		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet)
			// this sparks implementation is just too slow, removing for now
			/*,
			Sparks:[],
			SparkSheet:new createjs.SpriteSheet({
				images: ["images/particle.png"],
				frames: {width:50, height:50}
			}),
			Update:function(delta) {
				var spark = null;

				if (Game.Ticks % 20 == 0) {
					spark = new createjs.Sprite(this.SparkSheet);
					var scale = Math.random()/3;
					var r = Math.random() * (225 - 200) + 200;
					var g = Math.random() * (150 - 100) + 100;
					var b = 70;
					
					
					spark.scaleX = scale;
					spark.scaleY = scale;
				
					spark.x=(Game.Width * Math.random() -  Game.Screen.x) / Game.Screen.scaleX;
					spark.y=(Game.Height - Game.Screen.y) / Game.Screen.scaleY;
			
					spark.filters=[new createjs.ColorFilter(1, 1, 1, 1, -(255-r), -(255-g), -(255-b))];

					spark.cache(0,0, 100, 100);
				
					Game.Screen.addChild(spark);
					this.Sparks.push(spark);
				}
				for(var i=0; i<this.Sparks.length; i++) {
					spark = this.Sparks[i];
					spark.alpha -= .005;
					spark.y-=.5;
					if (spark.alpha <= 0) {
						Game.Screen.removeChild(spark);
					}
				}
			
			}
			*/
		};
		
		obj.Sprite = new createjs.Sprite(SpriteSheet);
		obj.Sprite.filters=[new createjs.ColorFilter(1, 1, 1, 1, -(255-r), -(255-g), -(255-b))];
		obj.Sprite.gotoAndPlay(0);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.scaleX=Game.Width/5; //5=width
		obj.Sprite.cache(0,0, 100, 100);
		obj.Sprite.UserData = obj;

		Game.Stage.addChild(obj.Sprite);
		return obj;
	},	
	Particle:function(x,y,r,g,b)  {
		if (!Game.Settings.efx) {
			return null;
		}
	
		var	SpriteSheet = new createjs.SpriteSheet({
			images: ["images/particle.png"],
			frames: {width:50, height:50}
		});

		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet)
		};
		obj.Sprite = new createjs.Sprite(SpriteSheet);
		obj.Sprite.filters=[new createjs.ColorFilter(1, 1, 1, 1, -(255-r), -(255-g), -(255-b))];
		obj.Sprite.gotoAndPlay(0);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.cache(0,0, 100, 100);
		obj.Sprite.UserData = obj;

		Game.Screen.addChild(obj.Sprite);
		return obj;
	},
	
	Portal:function(x,y,n)  {
		var	SpriteSheet = new createjs.SpriteSheet({
			images: ["images/portal.png"],
			frames: {width:120, height:186}
		});

		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			LevelTarget:n,
			Update:function(delta) {
				if(this.Sprite.x+42 < Player.Sprite.x + 50 && 
					this.Sprite.x+67  > Player.Sprite.x && 
					this.Sprite.y+120 < Player.Sprite.y + 50 && 
					this.Sprite.y+120  > Player.Sprite.y) {
						Game.PlaySound("harp2");
						Player.BonusScore = 0;
						Game.CurrentLevel=this.LevelTarget;
						Game.LoadLevel();
				}
			}
		};
		obj.Sprite = new createjs.Sprite(SpriteSheet);
		obj.Sprite.x=x;
		obj.Sprite.y=y;

		obj.Sprite.UserData = obj;
		
		var text = new createjs.Text(n, "24px InfernoFont", "#d0ae70");
		text.x = obj.Sprite.x+54;
		text.y = obj.Sprite.y+100;
		text.textBaseline = "alphabetic";

		Game.Screen.addChild(obj.Sprite);
		Game.Screen.addChild(text);
		
		
		return obj;
	},
	
	Sky: function(url)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: [url]
			,frames: {width:2000, height:280}
		});
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Update:function(delta) {

				this.Sprite.x = -Player.Sprite.x/20;
				this.Sprite.y = -(Game.Ycamera/90);//+200;
			}
		}
		
		obj.Sprite.x=0;
		obj.Sprite.y=0;
		obj.Sprite.UserData = obj;
		
		Game.Stage.addChild(obj.Sprite);

		return obj;
	},	

	Spring: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/spring.png"]
			,frames: {width:30, height:60}
		});
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Update:function(delta) {
				if (this.Sprite.x+16 < Player.Sprite.x + 50 && 
					this.Sprite.x+16 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 100 && // adjust for regY offset
					this.Sprite.y > Player.Sprite.y) {
					
					Game.PlaySound("spring");
					
					Player.Bounce();
					Player.GForce = -(Player.BounceVelocity * 2);	
					this.Sprite.scaleY = .1;
					
				}
				

				if (this.Sprite.scaleY < 1.0) {
					this.Sprite.scaleY += .14;
				}
				else {
					this.Sprite.scaleY = 1;
				}
			}
		}
		
		obj.Sprite.x=x;
		obj.Sprite.y=y+30;
		obj.Sprite.UserData = obj;
		obj.Sprite.regY = 60;
		Game.Screen.addChild(obj.Sprite);

		return obj;
	},	

	Temple: function(x,y) {
		var SpriteSheet= new createjs.SpriteSheet({
			images: ["images/temple.png"],
			frames: {width:470, height:280}
		});
		
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Slots:[],		
			Update:function(delta) {
				for(var i=0; i<this.Slots.length; i++) {
					if (this.Slots[i].alpha < 1) {
						this.Slots[i].alpha+= .01;
					}
				}
				
				if(this.Slots.length == 4 && Player.Score >= Game.Goal &&
					this.Sprite.x+210 < Player.Sprite.x + 50 && 
					this.Sprite.x+210+25  > Player.Sprite.x && 
					this.Sprite.y+200 < Player.Sprite.y + 50 && 
					this.Sprite.y+200 > Player.Sprite.y) {
						Game.Unlock=1;
						Player.Score -= Game.Goal;
						Game.PlaySound("harp2");
						Game.CurrentLevel=11;
						Game.LoadLevel();
				}
				
			},
			UnlockSlot:function() {
			
				var SlotSheet = new createjs.SpriteSheet({
					images: ["images/head.png"],
					frames: {width:36, height:33}
				});	
				var slot = new createjs.Sprite(SlotSheet);
				slot.alpha = 0;
				switch (this.Slots.length) {

					case 0:
						slot.x = this.Sprite.x+93;
						slot.y = this.Sprite.y+51+110;
						break;
					case 1:
						slot.x = this.Sprite.x+93;
						slot.y = this.Sprite.y+90+110;
						break;
					case 2:
						slot.x = this.Sprite.x+334;
						slot.y = this.Sprite.y+51+110;
						break;
					case 3:
						slot.x = this.Sprite.x+334;
						slot.y = this.Sprite.y+90+110;
						break;
				
				}
				this.Slots.push(slot);
				Game.Screen.addChild(slot);


			}
		};
	
		obj.Sprite = new createjs.Sprite(SpriteSheet);
		obj.Sprite.gotoAndStop(1);
		obj.Sprite.x=x;
		obj.Sprite.y=y;
		obj.Sprite.UserData = obj;

	
		Game.Screen.addChild(obj.Sprite);
		return obj;
	},

	Turbo: function(x,y)  {
		var SpriteSheet = new createjs.SpriteSheet({
			images: ["images/turbo.png"]
			,frames: {width:30, height:62}
		});
		var obj = {
			Sprite:new createjs.Sprite(SpriteSheet),
			Update:function(delta) {
				if (this.Sprite.x+16 < Player.Sprite.x + 50 && 
					this.Sprite.x+16 > Player.Sprite.x && 
					this.Sprite.y < Player.Sprite.y + 100 && // adjust for regY offset
					this.Sprite.y > Player.Sprite.y) {
					
					
					Game.PlaySound("turbo");
					
					
					Player.Bounce();
					Player.GForce = -(Player.BounceVelocity * 5);	
					
				}
			}
		}
		
		obj.Sprite.x=x;
		obj.Sprite.y=y+30;
		obj.Sprite.UserData = obj;
		Game.Screen.addChild(obj.Sprite);

		return obj;
	}
}	

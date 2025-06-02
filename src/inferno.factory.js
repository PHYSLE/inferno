/* ---------------------------

Copyright © 2007 - 2017 PHYSLE
All rights reserved.

--------------------------- */
import * as createjs from 'createjs-module';
import Game from '/src/inferno.game.js';
import Player from '/src/inferno.player.js';

var Put={
	balloon: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/balloon.png"]
			,frames: {width:30, height:40}
		});
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			floatVelocity:0,
			floatMax:12,
			update:function(delta) {
				if (this.sprite.x < Player.sprite.x + 35 && 
					this.sprite.x + 25 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 &&
					this.sprite.y  > Player.sprite.y) {
					
					Game.playSound("bounce");
					
					this.sprite.y+=20;
					Player.bounce();
					Player.gForce = -(Player.bounceVelocity * 2);	
					this.floatVelocity = -60;
					
				}
				if (this.floatVelocity < this.floatMax) {
					this.floatVelocity++;
				}
				this.sprite.y -= delta*this.floatVelocity;
			}
		}
		
		obj.sprite.x=x;
		obj.sprite.y=y+30;
		obj.sprite.UserData = obj;
		Game.screen.addChild(obj.sprite);

		return obj;
	},
	
	bonus: function(x,y) {
		var spriteSheet= new createjs.SpriteSheet({
			images: ["assets/images/bonus.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {			
			sprite:new createjs.Sprite(spriteSheet),
			update:function(delta) {
				if(	Player.hasKey &&
					this.sprite.x < Player.sprite.x + 50 && 
					this.sprite.x + 25 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && 
					this.sprite.y  > Player.sprite.y) {
						if (!Game.loadedBonus) {
							Game.playSound("door");
							Game.loadBonus();
						}
						Game.loadedBonus = true;
						this.sprite.gotoAndStop(1);
				}
			}
		};

		obj.sprite.gotoAndStop(Game.loadedBonus?1:0);

		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
	
		Game.screen.addChild(obj.sprite);
		return obj;
	},


	bonusExit: function(x,y) {
		var spriteSheet= new createjs.SpriteSheet({
			images: ["assets/images/bonus.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {			
			sprite:new createjs.Sprite(spriteSheet),
			glow:null,
			update:function(delta) {
				if(	Player.hasKey &&
					this.sprite.x < Player.sprite.x + 50 && 
					this.sprite.x + 25 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && 
					this.sprite.y  > Player.sprite.y) {
					Game.exitBonus();
					
					Game.playSound("harp");
				}
			}
		};

		obj.sprite.gotoAndStop(1);
		
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
	
		Game.screen.addChild(obj.sprite);
		return obj;
	},

	block: function(x,y,i)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/block" + i + ".png"],
			frames: {width:30 * i, height:30}
		});
		
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			waypoints:[],
			waypointTarget:1,
			width:30 * i,
			speed:100,
			update:function(delta) {
				if (this.sprite.x < Player.sprite.x + 35 && 
					(this.sprite.x + this.width) - 5 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 &&
					this.sprite.y  > Player.sprite.y) {
					Player.bounce();
				}
				
				if (this.waypoints && this.waypoints.length > 0) {
					var i = this.waypointTarget % this.waypoints.length;					
					var xd = Math.abs(this.sprite.x - this.waypoints[i].x);
					var yd = Math.abs(this.sprite.y - this.waypoints[i].y);

					if (xd <= delta*this.speed && yd <= delta*this.speed) {
						// arrived
						this.sprite.x = this.waypoints[i].x;
						this.sprite.y = this.waypoints[i].y;
						this.waypointTarget++;
					}
					else {
						if (this.sprite.x < this.waypoints[i].x) {
							this.sprite.x += delta*this.speed;
						}
						else if (this.sprite.x > this.waypoints[i].x) {
							this.sprite.x -= delta*this.speed;
						}
					
						if (this.sprite.y < this.waypoints[i].y) {
							this.sprite.y += delta*this.speed;
						}
						else if (this.sprite.y > this.waypoints[i].y) {
							this.sprite.y -= delta*this.speed;
						}			
					}
				}
			}
		}

		obj.sprite.gotoAndStop(i);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
		
		Game.screen.addChild(obj.sprite);
		return obj;
	},	

	branch: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/branch.png"],
			frames: {width:60, height:60},
			animations: {break:{frames:[1,2,3,4,5], next: false, speed:.8 }}
		});
		var obj = {
			broken:false,
			gForce:0,
			sprite:new createjs.Sprite(spriteSheet),
			update:function(delta) {
			
				if (this.broken) {
					this.gForce += Game.gravity;
					this.sprite.y += delta*this.gForce;
					this.sprite.alpha -= .02;
					
					//@TODO- remove the obj after yterminate
				
				}
			
				if (!this.Broken &&
					this.sprite.x < Player.sprite.x + 40 && 
					this.sprite.x + 40 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 &&
					this.sprite.y  > Player.sprite.y) {
					
					Game.playSound("branch");
					this.sprite.gotoAndPlay("branch");
					this.broken = true;

					Player.bounce();				
				}
				
			}
		}
		
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
		
		
		Game.screen.addChild(obj.sprite);
		
		obj.sprite.gotoAndStop(0);

		return obj;
	},	
	
	coin: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/coin.png"],
			frames: {width:24, height:24}
		});	
	
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			glow:Put.particle(x-23, y-15, 255, 185, 100),
			expanding:false,
			update:function(delta) {
				if (this.expanding) {
					this.sprite.scaleX += .04;
					this.sprite.regX = (this.sprite.scaleX * 12);
					if (this.sprite.scaleX >= 1.0) {
						this.expanding = false;
					}
				}
				else {
					this.sprite.scaleX -= .04;
					this.sprite.regX = (this.sprite.scaleX * 12);
					if (this.sprite.scaleX <= .1) {
						this.expanding = true;
					}
				}
				if (this.sprite.x < Player.sprite.x + 50 && 
					this.sprite.x + 12 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && 
					this.sprite.y  > Player.sprite.y) {

					Game.playSound("coins");
					
					var text = new createjs.Text("10", "20px InfernoFont", "#f0be00");
					text.x = this.sprite.x-6;
					text.y = this.sprite.y+12;
					text.textBaseline = "alphabetic";
					text.name = "points";

					Game.screen.addChild(text);

					Game.screen.removeChild(this.sprite);	
					if (this.glow) {	 
						Game.screen.removeChild(this.glow.sprite);
					}

					Player.score+=10;
					Game.updateScore();
					
				}
			}
		};

		obj.sprite.gotoAndPlay(0);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
		
		Game.screen.addChild(obj.sprite);
		Game.goal+=10;
		
		return obj;
	},	
	

	
	
	entrance: function(x,y) {
		var spriteSheet= new createjs.SpriteSheet({
			images: ["assets/images/exit.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
		};
	
		obj.sprite.gotoAndStop(1);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
	
		Game.screen.addChild(obj.sprite);
		return obj;
	},
	
	exit: function(x,y) {
		var spriteSheet= new createjs.SpriteSheet({
			images: ["assets/images/exit.png"],
			frames: {width:60, height:65}
		});
		
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			update:function(delta) {
				if(	Player.score >= Game.goal &&
					this.sprite.x < Player.sprite.x + 50 && 
					this.sprite.x + 25 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && 
					this.sprite.y  > Player.sprite.y) {
					
					Game.playSound("harp2");
					Player.score -= Game.goal;
					// save bonus
					Player.bonusScore = Player.score;
					Game.currentLevel++;
					Game.loadLevel();
				}
			}
		};
	
		obj.sprite.gotoAndStop(0);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
	
		Game.screen.addChild(obj.sprite);
		return obj;
	},

	fist: function(x, y, rl) {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/fist.png"],
			frames: {width:30, height:30}
		});	
		
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			initX:x,
			initY:y,
			facing:0,
			side:rl,
			update:function(delta) {
				if (this.side == 'r') {
					this.facing += .13;
				}
				else {
					this.facing -= .13;
				}
				
				
				this.sprite.x = this.initX + (Math.cos(this.facing) * 100);
				this.sprite.y = this.initY + (Math.sin(this.facing) * 100);
				
				
				if (this.sprite.x < Player.sprite.x + 50 && 
					this.sprite.x + 15 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && 
					this.sprite.y  > Player.sprite.y) {
					
					
					Game.playSound("bounce");
					//console.log("Punched in the face!");
					
					if (this.side == 'r') {
						Player.gPunch = 1000;
					}
					else {
						Player.gPunch = -1000;
					}
				}
			}
		}
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
		if (rl == 'r') {
			obj.sprite.gotoAndStop(1);
		}
		else {
			obj.sprite.gotoAndStop(0);
		
		}
		
		Game.screen.addChild(obj.sprite);
		
		return obj;
	},

	guard: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/head.png"],
			frames: {width:36, height:33}
		});	
	
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			lefty:Put.fist(x-115, y-30, 'l'),
			lefty2:Put.fist(x-115, y+30, 'l'),
			righty:Put.fist(x+115, y-30, 'r'),
			righty2:Put.fist(x+115, y+30, 'r'),
			glow:Put.particle(x-20, y-24, 255, 185, 100),
			update:function(delta) {

				if (this.sprite.x < Player.sprite.x + 50 && 
					this.sprite.x + 12 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && 
					this.sprite.y  > Player.sprite.y) {

					var text = new createjs.Text("100", "20px InfernoFont", "#f0be00");
					text.x = this.sprite.x-6;
					text.y = this.sprite.y+12;
					text.textBaseline = "alphabetic";
					text.name = "points";
					
					Game.playSound("coins");

					Game.screen.addChild(text);

					Game.screen.removeChild(this.sprite);		 
					Game.screen.removeChild(this.lefty.sprite);	 
					Game.screen.removeChild(this.righty.sprite);
					Game.screen.removeChild(this.lefty2.sprite);	 
					Game.screen.removeChild(this.righty2.sprite);
					
					if (this.glow) {						 
						Game.screen.removeChild(this.glow.sprite);	
					}
					
					if (Game.temple) {
						Game.temple.unlockSlot();
					}
					
					Player.score+=100;
					
					Player.bounce();
					
					Game.updateScore();
		
				}
			}
		};
		if (obj.glow) {
			obj.glow.sprite.scaleX = 1.6;	
			obj.glow.sprite.scaleY = 1.6;
		}
		obj.sprite.gotoAndPlay(0);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
		obj.righty2.facing = 1.3;
		obj.lefty2.facing = 1.3;
		
		Game.screen.addChild(obj.sprite);
		Game.goal+=100;
		
		return obj;
	},

	key: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/key.png"],
			frames: {width:20, height:47}
		});	
	
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			glow:Put.particle(x-15, y-15, 255, 185, 100),
			update:function(delta) {
				if (this.sprite.x < Player.sprite.x + 50 && 
					this.sprite.x + 12 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && 
					this.sprite.y  > Player.sprite.y) {

					Game.playSound("key");
					Game.screen.removeChild(this.sprite);		
					if (this.glow) {	 
						Game.screen.removeChild(this.glow.sprite);
					}
					Player.hasKey = true;
					//$("#key").html("&#9911;");
					document.getElementById('key').innerHTML='<img src="assets/images/icon-key.png" />';
				}
			}
		};

		obj.sprite.gotoAndPlay(0);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
		
		Game.screen.addChild(obj.sprite);

		return obj;
	},
	
	ladder: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/ladder.png"]
			,frames: {width:30, height:60}
		});
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			update:function(delta) {
				if (this.sprite.x+16 < Player.sprite.x + 50 && 
					this.sprite.x+16 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 50 && // allow going down
					this.sprite.y > Player.sprite.y) {
					if (Game.MOVING_DOWN) {
						Player.gForce=500;
					}
					else {
						Player.gForce=-500;			
					}	

				}
			}
		}
		
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;
		
		Game.screen.addChild(obj.sprite);

		return obj;
	},	
	
	lava:function(x,y,r,g,b)  {
		if (!Game.settings.efx) {
			return null;
		}

		var	spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/lava.png"],
			frames: {width:5, height:100}
		});

		var obj = {
			sprite:new createjs.Sprite(spriteSheet)
			// this sparks implementation is just too slow, removing for now
			,
			sparks:[],
			sparkSheet:new createjs.SpriteSheet({
				images: ["assets/images/particle.png"],
				frames: {width:50, height:50}
			}),
			update:function(delta) {
				var spark = null;

				if (Game.ticks % 30 == 0) {
					spark = new createjs.Sprite(this.sparkSheet);

					var r = 200;
					var g = 100;
					var b = 70;
					
					
					spark.scaleX = .5;
					spark.scaleY = .5;
				
					spark.x=(Game.width * Math.random() -  Game.screen.x) / Game.screen.scaleX;
					spark.y=(Game.height - Game.screen.y) / Game.screen.scaleY;
			
					spark.filters=[new createjs.ColorFilter(1, 1, 1, 1, -(255-r), -(255-g), -(255-b))];

					spark.cache(0,0, 100, 100);
				
					Game.screen.addChild(spark);
					this.sparks.push(spark);
				}
				for(var i=0; i<this.sparks.length; i++) {
					spark = this.sparks[i];
					spark.alpha -= .005;
					spark.y-=.7;
					if (spark.alpha <= 0) {
						Game.screen.removeChild(spark);
					}
				}
			
			}
			
		};
		

		obj.sprite.filters=[new createjs.ColorFilter(1, 1, 1, 1, -(255-r), -(255-g), -(255-b))];
		obj.sprite.gotoAndPlay(0);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.scaleX=Game.width/5; //5=width
		obj.sprite.cache(0,0, 100, 100);
		obj.sprite.UserData = obj;

		Game.stage.addChild(obj.sprite);
		return obj;
	},	
	particle:function(x,y,r,g,b)  {
		if (!Game.settings.efx) {
			return null;
		}
	
		var	spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/particle.png"],
			frames: {width:50, height:50}
		});

		var obj = {
			sprite:new createjs.Sprite(spriteSheet)
		};
		//obj.sprite = new createjs.Sprite(spriteSheet);
		obj.sprite.filters=[new createjs.ColorFilter(1, 1, 1, 1, -(255-r), -(255-g), -(255-b))];
		obj.sprite.gotoAndPlay(0);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.cache(0,0, 100, 100);
		obj.sprite.UserData = obj;

		Game.screen.addChild(obj.sprite);
		return obj;
	},
	
	portal:function(x,y,n)  {
		var	spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/portal.png"],
			frames: {width:120, height:186}
		});

		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			levelTarget:n,
			update:function(delta) {
				if(this.sprite.x+42 < Player.sprite.x + 50 && 
					this.sprite.x+67  > Player.sprite.x && 
					this.sprite.y+120 < Player.sprite.y + 50 && 
					this.sprite.y+120  > Player.sprite.y) {
						Game.playSound("harp2");
						Player.bonusScore = 0;
						Game.currentLevel=this.levelTarget;
						Game.loadLevel();
				}
			}
		};

		obj.sprite.x=x;
		obj.sprite.y=y;

		obj.sprite.UserData = obj;
		
		var text = new createjs.Text(n, "24px InfernoFont", "#d0ae70");
		text.x = obj.sprite.x+54;
		text.y = obj.sprite.y+100;
		text.textBaseline = "alphabetic";

		Game.screen.addChild(obj.sprite);
		Game.screen.addChild(text);
		
		
		return obj;
	},
	
	sky: function(url)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: [url]
			,frames: {width:2000, height:280}
		});
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			update:function(delta) {

				this.sprite.x = -Player.sprite.x/20;
				this.sprite.y = -(Game.ycamera/90);//+200;
			}
		}
		
		obj.sprite.x=0;
		obj.sprite.y=0;
		obj.sprite.UserData = obj;
		
		Game.stage.addChild(obj.sprite);

		return obj;
	},	

	spring: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/spring.png"]
			,frames: {width:30, height:60}
		});
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			update:function(delta) {
				if (this.sprite.x+16 < Player.sprite.x + 50 && 
					this.sprite.x+16 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 100 && // adjust for regY offset
					this.sprite.y > Player.sprite.y) {
					
					Game.playSound("spring");
					
					Player.bounce();
					Player.gForce = -(Player.bounceVelocity * 2);	
					this.sprite.scaleY = .1;
					
				}
				

				if (this.sprite.scaleY < 1.0) {
					this.sprite.scaleY += .14;
				}
				else {
					this.sprite.scaleY = 1;
				}
			}
		}
		
		obj.sprite.x=x;
		obj.sprite.y=y+30;
		obj.sprite.UserData = obj;
		obj.sprite.regY = 60;
		Game.screen.addChild(obj.sprite);

		return obj;
	},	

	temple: function(x,y) {
		var spriteSheet= new createjs.SpriteSheet({
			images: ["assets/images/temple.png"],
			frames: {width:470, height:280}
		});
		
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			slots:[],		
			update:function(delta) {
				for(var i=0; i<this.slots.length; i++) {
					if (this.slots[i].alpha < 1) {
						this.slots[i].alpha+= .01;
					}
				}
				
				if(this.slots.length == 4 && Player.score >= Game.goal &&
					this.sprite.x+210 < Player.sprite.x + 50 && 
					this.sprite.x+210+25  > Player.sprite.x && 
					this.sprite.y+200 < Player.sprite.y + 50 && 
					this.sprite.y+200 > Player.sprite.y) {
						Game.unlock=1;
						Player.score -= Game.goal;
						Game.playSound("harp2");
						Game.currentLevel=11;
						Game.loadLevel();
				}
				
			},
			unlockSlot:function() {
			
				var slotSheet = new createjs.SpriteSheet({
					images: ["assets/images/head.png"],
					frames: {width:36, height:33}
				});	
				var slot = new createjs.Sprite(slotSheet);
				slot.alpha = 0;
				switch (this.slots.length) {

					case 0:
						slot.x = this.sprite.x+93;
						slot.y = this.sprite.y+51+110;
						break;
					case 1:
						slot.x = this.sprite.x+93;
						slot.y = this.sprite.y+90+110;
						break;
					case 2:
						slot.x = this.sprite.x+334;
						slot.y = this.sprite.y+51+110;
						break;
					case 3:
						slot.x = this.sprite.x+334;
						slot.y = this.sprite.y+90+110;
						break;
				
				}
				this.slots.push(slot);
				Game.screen.addChild(slot);


			}
		};
	

		obj.sprite.gotoAndStop(1);
		obj.sprite.x=x;
		obj.sprite.y=y;
		obj.sprite.UserData = obj;

	
		Game.screen.addChild(obj.sprite);
		return obj;
	},

	turbo: function(x,y)  {
		var spriteSheet = new createjs.SpriteSheet({
			images: ["assets/images/turbo.png"]
			,frames: {width:30, height:62}
		});
		var obj = {
			sprite:new createjs.Sprite(spriteSheet),
			update:function(delta) {
				if (this.sprite.x+16 < Player.sprite.x + 50 && 
					this.sprite.x+16 > Player.sprite.x && 
					this.sprite.y < Player.sprite.y + 100 && // adjust for regY offset
					this.sprite.y > Player.sprite.y) {
					
					
					Game.playSound("turbo");
					
					
					Player.bounce();
					Player.gForce = -(Player.bounceVelocity * 5);	
					
				}
			}
		}
		
		obj.sprite.x=x;
		obj.sprite.y=y+30;
		obj.sprite.UserData = obj;
		Game.screen.addChild(obj.sprite);

		return obj;
	}
}	

export default Put;
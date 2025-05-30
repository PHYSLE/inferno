import * as createjs from 'createjs-module';
import Game from '/src/inferno.game.js'
var KEY_LEFT = 37,
	KEY_RIGHT = 39

var Player = {
	score: 0,
	bonusScore: 0,
		// must be multiples of Game.gravity 
	jumpVelocity: 0,//Game.gravity * 12,//from 15
	bounceVelocity: 0,//Game.gravity * 8,//from 10
	driftVelocity:260,//from 300
	gPunch:0,
	gForce:0,
	jumps:2,
	jumping:false,
	sprite:null,
	lastMove:KEY_RIGHT,
	maxG:1800,
	hasKey:false,
	spriteSheet:new createjs.SpriteSheet({
		images: ["/assets/images/player_r.png","/assets/images/player_l.png"],
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
	init:function(x,y) {
		Player.sprite = new createjs.Sprite(Player.spriteSheet);
		Player.sprite.x=x;
		Player.sprite.y=y;
		Player.gForce = 0;
		Player.gPunch = 0;
		Player.jumps = 2;
		Player.jumping = false;
		Game.screen.addChild(Player.sprite);
        Player.jumpVelocity= Game.gravity * 12;//from 15
	    Player.bounceVelocity= Game.gravity * 8;//from 10
	},
	update:function(delta) {
		Player.sprite.y += delta*Player.gForce;
		if (Player.gForce < Player.maxG) {
			Player.gForce += Game.gravity;
		}
		
		Player.sprite.x += delta*Player.gPunch;
		if (Player.gPunch > 0) {
			Player.gPunch -= 10;
		}
		else if (Player.gPunch < 0) {
			Player.gPunch += 10;
		}
		
		if (Player.gForce == 0) {
			if (Player.jumping) {
				if (Player.lastMove == KEY_LEFT) {
					Player.sprite.gotoAndPlay("fall_l");
				}
				else {
					Player.sprite.gotoAndPlay("fall_r");
				}
			}
			else {
				if (Player.lastMove == KEY_LEFT) {
					Player.sprite.gotoAndPlay("bounce2_l");
				}
				else {
					Player.sprite.gotoAndPlay("bounce2_r");
				}	
			}
		}
		if (Game.MOVING_LEFT) {
			Player.sprite.x -= delta*Player.driftVelocity;
		}
		if (Game.MOVING_RIGHT) {
			Player.sprite.x += delta*Player.driftVelocity;
		}		
	},
	bounce:function() {
		Player.gForce = -Player.bounceVelocity;	
		Player.jumping = false;
		Player.jumps = 2;
		Game.ytarget = -(Player.sprite.y) + Game.ycamoffset;
		if (Player.lastMove == KEY_LEFT) {
			Player.sprite.gotoAndPlay("bounce_l");
		}
		else  {
			Player.sprite.gotoAndPlay("bounce_r");
		}
	},
	jump:function() {
	
		if( Player.gForce > -Player.jumpVelocity && Player.jumps >0) {
			Player.gForce = -Player.jumpVelocity;
			Player.jumping = true;
			Player.jumps--;
			if (Player.lastMove == KEY_LEFT) {
				Player.sprite.gotoAndPlay("jump_l");
			}
			else {
				Player.sprite.gotoAndPlay("jump_r");
			}
			Game.playSound("flap");
		}	
	},
	move:function(direction) {
		Player.lastMove = direction;
		// todo - can we start at the frame we were on in the opposite animation?			
		// var i = Player.Sprite.currentFrame;

		if (Player.jumping) {
			if (Player.lastMove == KEY_LEFT) {
				if (Player.gForce > 0) {
					Player.sprite.gotoAndPlay("fall_l");				
				}
				else {
					Player.sprite.gotoAndPlay("jump_l");
				}
			}
			else {
				if (Player.gForce > 0) {
					Player.sprite.gotoAndPlay("fall_r");				
				}
				else {
					Player.sprite.gotoAndPlay("jump_r");
				}
			}		
		}
		else {
			if (Player.lastMove == KEY_LEFT) {
				Player.sprite.gotoAndPlay("bounce_l");
			}
			else  {
				Player.sprite.gotoAndPlay("bounce_r");
			}			
		}
		
	}
}


export default Player;
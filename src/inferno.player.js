import * as createjs from 'createjs-module';
import Game from '/src/inferno.game.js'
var KEY_LEFT = 37,
	KEY_RIGHT = 39

var Player = {
	Score: 0,
	BonusScore: 0,
		// must be multiples of Game.Gravity 
	JumpVelocity: 0,//Game.Gravity * 12,//from 15
	BounceVelocity: 0,//Game.Gravity * 8,//from 10
	DriftVelocity:260,//from 300
	GPunch:0,
	GForce:0,
	Jumps:2,
	Jumping:false,
	Sprite:null,
	LastMove:KEY_RIGHT,
	MaxG:1800,
	HasKey:false,
	SpriteSheet:new createjs.SpriteSheet({
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
	Init:function(x,y) {
		Player.Sprite = new createjs.Sprite(Player.SpriteSheet);
		Player.Sprite.x=x;
		Player.Sprite.y=y;
		Player.GForce = 0;
		Player.GPunch = 0;
		Player.Jumps = 2;
		Player.Jumping = false;
		Game.Screen.addChild(Player.Sprite);
        Player.JumpVelocity= Game.Gravity * 12;//from 15
	    Player.BounceVelocity= Game.Gravity * 8;//from 10
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
		if (Game.MOVING_LEFT) {
			Player.Sprite.x -= delta*Player.DriftVelocity;
		}
		if (Game.MOVING_RIGHT) {
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


export default Player;
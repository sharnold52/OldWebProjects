class Player extends PIXI.Sprite{
    constructor(x=0,y=0){
        super(PIXI.loader.resources["images/player.png"].texture);
        this.anchor.set(0.5,0.5); // position, scaling, rotating, etc. are now from center of sprite
        this.scale.set(0.3);
        this.x = x;
        this.y = y;
    }
}

class NonPlayer extends PIXI.Sprite{
    constructor(x, y){
        super(PIXI.loader.resources["images/npc.png"].texture);
        this.anchor.set(0.5,0.5); // position, scaling, rotating, etc. are now from center of sprite
        this.scale.set(0.3);
        this.x = x;
        this.y = y;
        this.run = false;
        
        // variables
    }
}

class NonPlayerSquare extends PIXI.Sprite{
    constructor(x, y, squarePos){
        super(PIXI.loader.resources["images/npc.png"].texture);
        this.anchor.set(0.5,0.5); // position, scaling, rotating, etc. are now from center of sprite
        this.scale.set(0.3);
        this.x = x;
        this.y = y;
        this.run = false;
        
        // variables
        this.squarePos = squarePos;
        this.positionTracker = 0;
    }
}
/*

At some point I've used this algorithm by @thijsmie:
    t2 = t * t
    t3 = t2 * t
    dx = t3 * (2 * (x0 - x1) + vx0 + vx1)
        + t2 * (3 * (x1 - x0) - 2 * vx0 - vx1)
        + t * vx0 + x0
    dy = t3 * (2 * (y0 - y1) + vy0 + vy1)
        + t2 * (3 * (y1 - y0) - 2 * vy0 - vy1)
        + t * vy0 + y0
Here,

(t) is time factor for interpolation (0..1)
(x0, y0) is initial position
(vx0, vy0) is initial velocity
(x1, y1) is destination position
(vx1, vy1) is destination velocity
(dx, dy) is interpolated position. 

// duration in this simplified example is snapshot sending interval in [ms]
Player.prototype.interpolateTo = function(data, duration) {
  if(typeof data.x != "undefined") {
    // step needed to get `destination x` within `duration` miliseconds
    this.stepValues.x = Math.abs(data.x - this.x) / duration;
    this.target.x = data.x;
  } 
  // ...
}

// step you call for each game loop iteration
Player.prototype.step = function(delta) {
  if(this.x < this.target.x) {
    this.x += delta * this.stepValues.x
  }
}

*/

var car,
    cars = {},
    sock,
    ip = "178.62.112.80";
    //ip = "localhost";

var state = {
    rpm: 0,
    pos: null,
    init: function() {
        
        /* console.log("Cool, we're IN! ;)");

           Particles system / Sound.
           MapLoader, serious one.
        */
    },
    preload: function() {
        
        game.load.atlas('car', 'img/f1/cars.png', 'img/f1/cars.json');
        game.load.tilemap('testtrack', 'img/f1/watkins.json', null, Phaser.Tilemap.TILED_JSON);
        
        game.load.image('finishline', 'img/f1/tileset/finishlinev.png');
        game.load.image('slower', 'img/f1/tileset/slower.png');
        game.load.image('collide', 'img/f1/tileset/collide.png');
        game.load.image('watkins', 'img/f1/tileset/watkins.png');

    },
    create: function() {

        //game.world.setBounds(-1728, -1056, 3456, 2112);
        game.physics.startSystem(Phaser.Physics.ARCADE);
       
        land = game.add.tilemap('testtrack');
        
        land.addTilesetImage('finishline', 'finishline');
        land.addTilesetImage('slower', 'slower');
        land.addTilesetImage('collide', 'collide');
        land.addTilesetImage('watkins', 'watkins');

        track = land.createLayer('test');
        track.resizeWorld();

        finish = land.createLayer('finishline');
        finish.resizeWorld();
        finish.renderable = false;
        land.setCollision(1783, true, finish);
        land.setTileIndexCallback(1783, helpers.throttle(helpers.emitFinish, 10000, {trailing: false}), game, finish);

        slower = land.createLayer('slowerline');
        slower.resizeWorld();
        slower.renderable = false;
        land.setCollision(1784, true, slower);
        land.setTileIndexCallback(1784, helpers.emitSlower, game, slower);

        collide = land.createLayer('collideline');
        collide.resizeWorld();
        collide.renderable = false;
        land.setCollision(1785, true, collide);        

        land.fixedToCamera = true;

        car = game.add.sprite(820, 1880, 'car', 'car1');
        car.anchor.setTo(0.5, 0.5);
        car.angle = 180;
        game.physics.enable(car, Phaser.Physics.ARCADE);
     
        car.body.collideWorldBounds = true;
        car.body.bounce.setTo(3, 3);

        shadow = game.add.sprite(0, 0, 'car', 'shadow');
        shadow.anchor.setTo(0.35, 0.40);
        car.bringToTop();

        game.camera.follow(car);
        game.camera.focusOnXY(0, 0);

        cursors = game.input.keyboard.createCursorKeys();
        window.addEventListener("deviceorientation", helpers.handleOrientation, true);

        timer = game.time.create(false);
        timer.start();

        state.pos = JSON.stringify({
            x: car.x,
            y: car.y,
            angle: car.angle,
            cmdtime: timer.ms
            });

        //create a new ws connection and send our position to others
        sock = new WebSocket("ws://" + ip + ":3000/ws");
        sock.onopen = function() {
            //console.log(state.pos);
            sock.send(state.pos);
            };

        sock.onmessage = function(message) {
            var m = JSON.parse(message.data);
            if (m.New) {
                cars[m.Id] = spawn(m);
            } else if (m.Online === false) {
               // cars[m.Id].label.destroy();
                cars[m.Id].destroy();
            } else {
                uPosition(m);
            }
        };
       // game.time.events.loop(67, sendPos, this);
        
    },
    update: function() {

        if (cursors.left.isDown) { car.angle -= 2; }
        else if (cursors.right.isDown) { car.angle += 2; }

        if (cursors.up.isDown) { 
            if (state.rpm < 700) { state.rpm += 3; }
        } else {
            if (state.rpm > 0) { state.rpm -= 2; }
        }

        if (cursors.down.isDown) { 
            if (state.rpm > 0) { state.rpm -= 10; }
            else if (state.rpm <= 0) { state.rpm = -80; }
        }

        if (cursors.down.isUp && state.rpm < 0) { state.rpm = 0; }

        state.pos = JSON.stringify({
            x: car.x,
            y: car.y,
            angle: car.angle,
            cmdtime: timer.ms
            });
        if (sock.readyState == 1) {
        sock.send(state.pos);
        }

        car.body.maxVelocity.setTo(700, 700);
        game.physics.arcade.collide(car, finish);
        game.physics.arcade.collide(car, slower);
        game.physics.arcade.collide(car, collide);
        game.physics.arcade.velocityFromRotation(car.rotation, state.rpm, car.body.velocity);

        //console.log(car.body.velocity);
        shadow.x = car.x;
        shadow.y = car.y;
        shadow.rotation = car.rotation;

    },
    render: function() {
        //game.debug.body(car);
        game.debug.text('RPM ' + state.rpm, 32, 32);
        game.debug.text('Lap: ' + helpers.lap, 32, 48);
        game.debug.text('Timing: ' + timer.ms, 32, 64);
    }
};

function spawn(m) {

        //var label = m.Id.match(/(^\w*)-/i)[1];
        p = game.add.sprite(820, 1880, 'car', 'car1');
        p.anchor.setTo(0.5, 0.5);
        p.angle = 180;
        game.physics.enable(p, Phaser.Physics.ARCADE);
     
        p.body.collideWorldBounds = true;
        p.body.bounce.setTo(3, 3);
    
       //p.label = game.add.text(m.X, m.Y - 10, label, style);
        return p;
    }

    function uPosition(m) {
        //var delta = timer.ms - m.CMDTIME;
        //var stepX = m.X - cars[m.Id].x;
        //console.log(stepX + "stepX");
        //console.log(m.X + "primaMX!");
        //console.log(cars[m.Id].x + "prima!");
       // console.log(delta + "delta!");
        cars[m.Id].x = m.X;
        //console.log(cars[m.Id].x + "dopo!");
        cars[m.Id].y = m.Y;
        cars[m.Id].angle = m.ANGLE;
       // cars[m.Id].label.y = m.Y - 10;
    }
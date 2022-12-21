var hitSource = "https://www.kasandbox.org/programming-sounds/rpg/metal-clink.mp3"

var playing = false;

var programCode = function(processingInstance) {
    with(processingInstance) {
        // from https://www.khanacademy.org/computer-programming/pendulums/5438524232351744
        size(600, 400);
        frameRate(60);

        // overwrite to use degrees
        var sin = function(deg) {
            return Math.sin(radians(deg));
        };
        var cos = function(deg) {
            return Math.cos(radians(deg));
        };
        var atan2 = function(y, x) {
            return degrees(Math.atan2(y, x));
        }

        var g = 9.81;

        // Glitch fixed! 15 votes, awesome!
        // Click on the canvas to hear the sound

        var pendulums = []; // all pendulums
        var Pendulum = function(x, y, length, radius, rot) {
            this.density = 0.2;

            this.x = x;
            this.y = y;
            this.bx = x + (length + radius) * cos(rot);
            this.by = y + (length + radius) * sin(rot);
            this.rot = rot;
            this.length = length;
            this.radius = radius;
            this.mass = pow(radius, 2) / 1000 * this.density;
            // estimated mass, in kilograms (/1000)

            this.vel = new PVector(0, 0, 0);
            pendulums.push(this);
        };
        Pendulum.prototype.update = function() {
            this.vel.add(0, this.mass * g, 0); // apply gravity
            this.bx += this.vel.x;
            this.by += this.vel.y;
            this.rot = atan2(this.by - this.y, this.bx - this.x); // rotate cord

            var end = this.move(this.length + this.radius);
            var d = dist(end.x, end.y, this.bx, this.by);
            // forceDir says whether the ball is pushing in or out, so rotates direction by 180 if going out, vice versa

            var forceDir = dist(this.x, this.y, this.bx, this.by) >= this.length + this.radius;
            var r = forceDir ? (this.rot + 180) : (this.rot);
            this.vel.add(d * cos(r), d * sin(r), 0); // pull towards cord
            this.bx = end.x; // push out
            this.by = end.y;
        };
        Pendulum.prototype.collide = function(p) {
            // inner distance, if negative = collision, dist between minus sum of radii
            var innerDist = dist(p.bx, p.by, this.bx, this.by) - (p.radius + this.radius);
            // check for collision
            if(innerDist < 0) {
                // shallow copies of movement vectors
                var f1 = p.vel.get();
                var f2 = this.vel.get();
                // decollide
                var half = innerDist / 2;
                this.vel.add(half * cos(this.rot + 180), half * sin(this.rot + 180), 0);
                p.vel.add(half * cos(p.rot + 180), half * sin(p.rot + 180), 0);
                // swap vectors
                p.vel = f2;
                this.vel = f1;

                this.update(); // update positions
                p.update();

                // very important: play satisfying sound
                var hit = new Audio(hitSource);
                hit.volume = constrain(this.vel.mag() / 10, 0.05, 1); // change volume
                hit.play(); // volumes is based on strength of impact
            }
        };
        Pendulum.prototype.getEnd = function() {
            return new PVector(
                this.x + this.length * cos(this.rot),
                this.y + this.length * sin(this.rot)
            );
        };
        Pendulum.prototype.move = function(distance) {
            return new PVector(
                this.x + distance * cos(this.rot),
                this.y + distance * sin(this.rot)
            );
        };
        Pendulum.prototype.draw = function() {
            pushMatrix();
            var end = this.getEnd();
            line(this.x, this.y, end.x, end.y);
            noFill();
            ellipse(this.bx, this.by, this.radius * 2, this.radius * 2);
            popMatrix();
        };
        Pendulum.all = function() { // static function
            if(playing) {
                // from https://www.khanacademy.org/computer-programming/ball-physics-v3/5149911758192640
                // update, collision, draw
                for(var i = 0; i < pendulums.length; i++) {
                    pendulums[i].update();
                }
                // collide ball 1 with all pendulums but itself, #2 with all pendulums except for #1, etc
                var whitelist = 0; // amount of whitelisted pendulums from start
                // no need to collide the last one to anything, so pendulums.length - 1
                for(var i = 0; i < pendulums.length - 1; i++) {
                    whitelist++;
                    for(var j = whitelist; j < pendulums.length; j++) {
                        pendulums[i].collide(pendulums[j]);
                    }
                }
            }
            for(var i = 0; i < pendulums.length; i++) {
                pendulums[i].draw();
            }

        };

        var halfW = width / 2;
        var halfH = height / 2;
        var pendulumLeft = new Pendulum(halfW - 35, halfH, 80, 10, 100);
        var pendulumMiddle = new Pendulum(halfW, halfH, 85, 12, 80);
        var pendulumRight = new Pendulum(halfW + 35, halfH, 83, 7, 17);

        stroke(0);
        strokeWeight(2);
        draw = function() {
            background(255);
            line(0, halfH, width, halfH);
            Pendulum.all();
        };
    }
};

// canvas element
var canvas = document.getElementById("canvas");

// create new ProcessingJS instance
var processingInstance = new Processing(canvas, programCode);

canvas.onclick = function() {
    playing = true;
}

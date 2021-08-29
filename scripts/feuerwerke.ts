/*

Converted to TypeScript and modified from https://codepen.io/GabeStah/pen/BZxJmy


Copyright (c) 2019 by Gabe (https://codepen.io/GabeStah/pen/BZxJmy)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

class FireworkConfig {
	// Base firework acceleration.
	// 1.0 causes fireworks to travel at a constant speed.
	// Higher number increases rate firework accelerates over time.
	public static readonly acceleration = 1.05;
	// Minimum firework brightness.
	public static readonly brightnessMin = 50;
	// Maximum firework brightness.
	public static readonly brightnessMax = 70;
	// Base speed of fireworks.
	public static readonly speed = 5;
	// Base length of firework trails.
	public static readonly trailLength = 3;
	// Determine if target position indicator is enabled.
	public static readonly targetIndicatorEnabled = true;
}

class ParticleConfig {
	// Minimum particle brightness.
	public static readonly brightnessMin = 50;
	// Maximum particle brightness.
	public static readonly brightnessMax = 80;
	// Base particle count per firework.
	public static readonly count = 100;
	// Minimum particle decay rate.
	public static readonly decayMin = 0.015;
	// Maximum particle decay rate.
	public static readonly decayMax = 0.03;
	// Base particle friction.
	// Slows the speed of particles over time.
	public static readonly friction = 0.95;
	// Base particle gravity.
	// How quickly particles move toward a downward trajectory.
	public static readonly gravity = 0.7;
	// Variance in particle coloration.
	public static readonly hueVariance = 20;
	// Base particle transparency.
	public static readonly transparency = 1;
	// Minimum particle speed.
	public static readonly speedMin = 1;
	// Maximum particle speed.
	public static readonly speedMax = 10;
	// Base length of explosion particle trails.
	public static readonly trailLength = 5;
}

class OtherConfig {
	// Alpha level that canvas cleanup iteration removes existing trails.
	// Lower value increases trail duration.
	public static readonly cleanupAlpha = 0.15;
	// Hue change per loop, used to rotate through different firework colors.
	public static readonly hueStepIncrease = 0.5;
	// Minimum number of ticks between each firework launch.
	public static readonly ticksPerFireworkMin = 20;
	// Maximum number of ticks between each firework launch.
	public static readonly ticksPerFireworkMax = 80;
	// Part of screen to show fireworks
	public static readonly horizon = 2/3;
}

class Feuerwerke {
	protected window = window;
	protected document = this.window.document;

	protected _$canvas!: HTMLCanvasElement | undefined;
	protected get $canvas() {
		return this._$canvas || (this._$canvas = this.document.documentElement.querySelector<HTMLCanvasElement>('canvas[data-display="feuerwerke"]') ?? undefined);
	}

	// Set the context, 2d in this case.
	protected _context!: CanvasRenderingContext2D | undefined;
	public get context() {
		return this._context || (this._context = this.$canvas?.getContext("2d") ?? undefined);
	}

	public fireworks: Array<Firework> = [];
	public particles: Array<Particle> = [];

	protected isRunning = false;

	// Initial hue.
	public hue = 120;
	// Track number of ticks since firework.
	protected ticksSinceFirework = 0;

	// Use requestAnimationFrame to maintain smooth animation loops.
	// Fall back on setTimeout() if browser support isn't available.
	protected requestAnimationFrame: typeof window.requestAnimationFrame = (this.window.requestAnimationFrame || this.window.webkitRequestAnimationFrame || this.window.mozRequestAnimationFrame || (callback => this.window.setTimeout(callback, 1000 / 60))).bind(window);

	public constructor() {
		if (this.document.readyState === "loading") {
			this.document.addEventListener("DOMContentLoaded", this.maximizeCanvas);
		} else {
			this.maximizeCanvas();
		}
		this.window.addEventListener("resize", this.maximizeCanvas);
	}

	public start = () => {
		if (!this.isRunning) {
			this.isRunning = true;
			this.hue = this.random(0, 360);
			this.animate();
		}
	}

	public stop = () => {
		this.isRunning = false;
	}

	protected maximizeCanvas = () => {
		if (this.$canvas) {
			this.$canvas.width = window.innerWidth;
			this.$canvas.height = window.innerHeight;
		}
	}

	protected animate = () => {
		if (this.isRunning || (this.fireworks.length > 0) || (this.particles.length > 0)) {
			// Smoothly request animation frame for each loop iteration.
			this.requestAnimationFrame(this.animate);
		}

		// Adjusts coloration of fireworks over time.
		//this.hue += OtherConfig.hueStepIncrease;

		this.cleanCanvas();
		this.updateFireworks();
		this.updateParticles();

		if (this.isRunning) {
			this.createFirework();
		}
	}

	// Cleans up the canvas by removing older trails.
	//
	// In order to smoothly transition trails off the canvas, and to make them 
	// appear more realistic, we're using a composite fill.
	// Set the initial composite mode to "destination-out" to keep content that
	// overlap with the fill we're adding.
	//
	// see: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
	protected cleanCanvas = () => {
		if (this.$canvas && this.context) {
			if (this.isRunning || (this.fireworks.length > 0) || (this.particles.length > 0)) {
				// Set "destination-out" composite mode, so additional fill doesn't remove non-overlapping content.
				this.context.globalCompositeOperation = "destination-out";

				// Set alpha level of content to remove.
				// Lower value means trails remain on screen longer.
				this.context.fillStyle = `rgba(0, 0, 0, ${OtherConfig.cleanupAlpha})`;

				// Fill entire canvas.
				this.context.fillRect(0, 0, this.$canvas.width, this.$canvas.height);

				// Reset composite mode to "lighter", so overlapping particles brighten each other.
				this.context.globalCompositeOperation = "lighter";
			} else {
				this.context.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
			}
		}
	}

	// Update all active fireworks.
	protected updateFireworks = () => {
		// Loop backwards through all fireworks, drawing and updating each.
		for (let i = this.fireworks.length - 1; i >= 0; --i) {
			this.fireworks[i].draw();
			this.fireworks[i].update(i);
		}
	}

	protected updateParticles = () => {
		// Loop backwards through all particles, drawing and updating each.
		for (let i = this.particles.length - 1; i >= 0; --i) {
			this.particles[i].draw();
			this.particles[i].update(i);
		}
	}

	protected createFirework() {
		if (this.$canvas) {
			if (this.ticksSinceFirework >= this.random(OtherConfig.ticksPerFireworkMin, OtherConfig.ticksPerFireworkMax)) {
				const width = this.$canvas.width;
				const height = this.$canvas.height;

				// Set start position to bottom center.
				const startX = width / 2;
				const startY = height;

				// Set end position to random position, somewhere above the horizon.
				const endX = this.random(0, width);
				const endY = this.random(0, height * OtherConfig.horizon);

				// Create new firework and add to collection.
				this.fireworks.push(new Firework(startX, startY, endX, endY));

				// Reset tick counter.
				this.ticksSinceFirework = 0;
			} else {
				this.ticksSinceFirework++;
			}
		}
	}

	// Create particle explosion at "x" and "y" coordinates.
	public createParticles(x: number, y: number) {
		// Higher numbers may reduce performance.
		let particleCount = ParticleConfig.count;
		while (particleCount--) {
			// Create a new particle and add it to particles collection.
			this.particles.push(new Particle(x, y));
		}
	}

	// Get a random number within the specified range.
	public random(min: number, max: number) {
		return Math.random() * (max - min) + min;
	}

	// Calculate the distance between two points.
	public calculateDistance(aX: number, aY: number, bX: number, bY: number) {
		const xDistance = aX - bX;
		const yDistance = aY - bY;
		return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
	}
}

// Path begins at "start" point and ends and "end" point.
class Firework {
	protected feuerwerke = window.feuerwerke;

	protected x: number;
	protected y: number;
	protected startX: number;
	protected startY: number;
	protected endX: number;
	protected endY: number;

	protected distanceToEnd: number;
	protected distanceTraveled = 0;

	protected angle: number;
	protected speed = FireworkConfig.speed;
	protected acceleration = FireworkConfig.acceleration;
	protected brightness = this.feuerwerke.random(FireworkConfig.brightnessMin, FireworkConfig.brightnessMax);

	// Track current trail particles.
	protected trail: Array<[number, number]> = [];
	// Trail length determines how many trailing particles are active at once.
	protected trailLength = FireworkConfig.trailLength;


	public constructor (startX: number, startY: number, endX: number, endY: number) {
		this.x = startX;
		this.y = startY;
		this.startX = startX;
		this.startY = startY;
		this.endX = endX;
		this.endY = endY;
		this.distanceToEnd = this.feuerwerke.calculateDistance(startX, startY, endX, endY);

		// While the trail length remains, add current point to trail list.
		while (this.trailLength--) {
			this.trail.push([this.x, this.y]);
		}

		// Calculate the angle to travel from start to end point.
		this.angle = Math.atan2(endY - startY, endX - startX);
	}

	// "index" parameter is index in "fireworks" array to remove, if journey is complete.
	public update = (index: number) => {
		// Remove the oldest trail particle.
		this.trail.pop();

		// Add the current position to the start of trail.
		this.trail.unshift([this.x, this.y]);

		// Increase speed based on acceleration rate.
		this.speed *= this.acceleration;

		// Calculate current velocity for both x and y axes.
		const xVelocity = Math.cos(this.angle) * this.speed;
		const yVelocity = Math.sin(this.angle) * this.speed;

		// Calculate the current distance traveled based on starting position, current position, and velocity.
		// This can be used to determine if firework has reached final position.
		this.distanceTraveled = this.feuerwerke.calculateDistance(this.startX, this.startY, this.x + xVelocity, this.y + yVelocity);

		// Check if final position has been reached (or exceeded).
		if (this.distanceTraveled >= this.distanceToEnd) {
			// Destroy firework by removing it from collection.
			this.feuerwerke.fireworks.splice(index, 1);

			// Create particle explosion at end point.  Important not to use this.x and this.y, 
			// since that position is always one animation loop behind.
			this.feuerwerke.createParticles(this.endX, this.endY);
		} else {
			// End position hasn't been reached, so continue along current trajectory by updating current coordinates.
			this.x += xVelocity;
			this.y += yVelocity;
		}
	}

	// Use CanvasRenderingContext2D methods to create strokes as firework paths. 
	public draw = () => {
		if (this.feuerwerke.context) {
			// Begin a new path for firework trail.
			this.feuerwerke.context.beginPath();

			// Get the coordinates for the oldest trail position.	
			const trailEndX = this.trail[this.trail.length - 1][0];
			const trailEndY = this.trail[this.trail.length - 1][1];

			// Create a trail stroke from trail end position to current firework position.
			this.feuerwerke.context.moveTo(trailEndX, trailEndY);
			this.feuerwerke.context.lineTo(this.x, this.y);

			// Set stroke coloration and style.
			// Use hue, saturation, and light values instead of RGB.
			this.feuerwerke.context.strokeStyle = `hsl(${this.feuerwerke.hue}, 100%, ${this.brightness}%)`;

			// Draw stroke.
			this.feuerwerke.context.stroke();
		}
	}
}

// Creates a new particle at provided "x" and "y" coordinates.
class Particle {
	protected feuerwerke = window.feuerwerke;

	protected x: number;
	protected y: number;

	protected angle: number;
	//protected speed = FireworkConfig.speed;
	//protected acceleration = FireworkConfig.acceleration;
	//protected brightness = Fireworks.random(FireworkConfig.brightnessMin, FireworkConfig.brightnessMax);

	protected friction = ParticleConfig.friction;
	protected gravity = ParticleConfig.gravity;
	protected decay = this.feuerwerke.random(ParticleConfig.decayMin, ParticleConfig.decayMax);	
	protected speed = this.feuerwerke.random(ParticleConfig.speedMin, ParticleConfig.speedMax);
	protected transparency = ParticleConfig.transparency;
	protected brightness = this.feuerwerke.random(ParticleConfig.brightnessMin, ParticleConfig.brightnessMax);
	// Set the hue to somewhat randomized number.
	// This gives the particles within a firework explosion an appealing variance.
	protected hue = this.feuerwerke.random(this.feuerwerke.hue - ParticleConfig.hueVariance, this.feuerwerke.hue + ParticleConfig.hueVariance);

	// Create an array to track current trail particles.
	protected trail: Array<[number, number]> = [];
	// Trail length determines how many trailing particles are active at once.
	protected trailLength = ParticleConfig.trailLength;

	public constructor(x: number, y: number) {
		this.x = x;
		this.y = y;

		// To better simulate a firework, set the angle of travel to random value in any direction.
		this.angle = this.feuerwerke.random(0, Math.PI * 2);

		// While the trail length remains, add current point to trail list.
		while (this.trailLength--) {
			this.trail.push([this.x, this.y]);
		}
	}

	// "index" parameter is index in "particles" array to remove, if journey is complete.
	public update = (index: number) => {
		// Remove the oldest trail particle.
		this.trail.pop();

		// Add the current position to the start of trail.
		this.trail.unshift([this.x, this.y]);

		// Decrease speed based on friction rate.
		this.speed *= this.friction;

		// Calculate current position based on angle, speed, and gravity (for y-axis only).
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed + this.gravity;

		// Apply transparency based on decay.
		this.transparency -= this.decay;

		// Use decay rate to determine if particle should be destroyed.
		if (this.transparency <= this.decay) {
			// Destroy particle once transparency level is below decay.
			this.feuerwerke.particles.splice(index, 1);
		}
	}

	// Use CanvasRenderingContext2D methods to create strokes as particle paths. 
	public draw = () => {
		if (this.feuerwerke.context) {
			// Begin a new path for particle trail.
			this.feuerwerke.context.beginPath();

			// Get the coordinates for the oldest trail position.	
			const trailEndX = this.trail[this.trail.length - 1][0];
			const trailEndY = this.trail[this.trail.length - 1][1];

			// Create a trail stroke from trail end position to current particle position.
			this.feuerwerke.context.moveTo(trailEndX, trailEndY);
			this.feuerwerke.context.lineTo(this.x, this.y);

			// Set stroke coloration and style.
			// Use hue, brightness, and transparency instead of RGBA.
			this.feuerwerke.context.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.transparency})`;
			this.feuerwerke.context.stroke();
		}
	}
}

window.Feuerwerke = Feuerwerke;
export default Feuerwerke;
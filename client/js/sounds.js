function Sounds(prefix) {
	prefix = prefix || "";
	var SOUNDS = [
		{
			name: "targeted",
			src: prefix + "sounds/target.wav"
		},
		{
			name: "killed",
			src: prefix + "sounds/kill.wav"
		}
	];
	this.sounds = {};

	for (var i = 0; i < SOUNDS.length; i++) {
		var sound = new Audio();
		sound.src = SOUNDS[i].src;
		sound.name = SOUNDS[i].name;
		sound.ready = false;
		sound.playWhenReady = false;
		sound.loop = false;
		sound.autoplay = false;
		sound.addEventListener("canplaythrough", function() {
			this.ready = true;
			if (this.playWhenReady) {
				this.play();
				this.playWhenReady = false;
			}
		});
		this.sounds[sound.name] = sound;
	}
	this.play = function(name, loop) {
		var sound = this.sounds[name];
		if (sound) {
			sound.loop = !!loop;
			if (!sound.ready) {
				sound.playWhenReady = true;
			}
			else {
				sound.play();
			}
		}
	}
	this.stop = function(name) {
		var sound = this.sounds[name];
		if (sound) {
			if (!sound.ready) {
				sound.playWhenReady = false;
			}
			else {
				sound.pause();
				sound.loop = false;
				sound.currentTime = 0;
			}
		}
	}
};
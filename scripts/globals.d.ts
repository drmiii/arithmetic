import type Arithmetic from "./arithmetic";
import type ArithmeticGame from "./arithmetic-game";
import type ArithmeticRound from "./arithmetic-round";
import type Utilities from "./utilities";
import type Random from "./random";
import type Feuerwerke from "./feuerwerke";

declare global {
	interface Window {
		Feuerwerke: typeof Feuerwerke;
		feuerwerke: Feuerwerke;
		Arithmetic: typeof Arithmetic;
		arithmetic: Arithmetic;
		ArithmeticGame: typeof ArithmeticGame;
		ArithmeticRound: typeof ArithmeticRound;
		Utilities: typeof Utilities;
		Random: typeof Random;
		webkitRequestAnimationFrame: any;
		mozRequestAnimationFrame: any;
	}

	interface Document {
		mozCancelFullScreen: any;
		msExitFullscreen: any;
		webkitExitFullscreen: any;
		fullscreenElement: Element;
		mozFullScreenElement: Element;
		msFullscreenElement: Element;
		webkitFullscreenElement: Element;
	}

	interface Element {
		mozRequestFullScreen: any;
		msRequestFullscreen: any;
		webkitRequestFullscreen: any;
	}
}
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// - horizontal spacing of numbers when less than 6
// - vertical centering of target and tiles when less than 4
// - fireworks animation
// - change the way tiles are structured
// - debounce firework canvas resize
// - clearing of fireworks could be better - fade?
// - possibly use request animation frame to update interface more smoothly and maybe not cause a stutter on shuffle while fireworks are going
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

import type ArithmeticGame from "./arithmetic-game";

class Arithmetic {
	protected static window = window;
	protected static document = Arithmetic.window.document;
    protected $rootNode = Arithmetic.document.documentElement;
    
	protected requestFullscreen: typeof document.documentElement.requestFullscreen = this.$rootNode.requestFullscreen || this.$rootNode.webkitRequestFullscreen || this.$rootNode.msRequestFullscreen || this.$rootNode.mozRequestFullScreen;
    protected exitFullscreen: typeof document.exitFullscreen = Arithmetic.document.exitFullscreen || Arithmetic.document.webkitExitFullscreen || Arithmetic.document.msExitFullscreen || Arithmetic.document.mozCancelFullScreen;

	protected game!: ArithmeticGame;
    
    public constructor() {
		if (!this.requestFullscreen || !this.exitFullscreen) {
			this.$rootNode.classList.add("no-fullscreen");
        }

		Arithmetic.document.addEventListener("keydown", this.onKeydown);
		Arithmetic.document.addEventListener("click", this.onClick);
        
		if (Arithmetic.document.readyState === "loading") {
			Arithmetic.document.addEventListener("DOMContentLoaded", () => this.newGame(true));
		} else {
			this.newGame(true);
		}
    }

    protected onKeydown = (e: KeyboardEvent) => {
		if (e.key === "F11") {
			e.preventDefault();
			this.toggleFullscreen();
		} else if (!e.ctrlKey) {
            switch (e.key) {
			    case "N":
                case "n":
                    e.preventDefault();
                    this.game.newRound();
                    break;

			    case "R":
                case "r":
                    e.preventDefault();
                    this.game.reset();
                    break;

                case "U":
                case "u":
                    e.preventDefault();
                    this.game.undo();
                    break;

                case "+":
                    e.preventDefault();
                    this.game.add();
                    break;

                case "-":
                    e.preventDefault();
                    this.game.subtract();
                    break;

                case "*":
                    e.preventDefault();
                    this.game.multiply();
                    break;

                case "/":
                    e.preventDefault();
                    this.game.divide();
                    break;
			}
		}
    }

	protected onClick = (e: MouseEvent) => {
		if (e.target instanceof Element) {
            const $target = e.target.closest<HTMLButtonElement>('button[data-action]');
            if ($target) {
                const action = $target.dataset.action;
                switch (action) {
                    case "fullscreen":
				        this.toggleFullscreen();
                        break;

                    case "shuffle":
				        this.game.newRound();
                        break;

                    case "reset":
                    case "undo":
                    case "add":
                    case "subtract":
                    case "multiply":
                    case "divide":
                        this.game[action]();
                        break;
                }
            } else if (e.target.closest('input[type="checkbox"][data-action="operand"]')) {
				this.game.toggleOperators();
			}
		}
    }
    
    protected newGame = (loadSavedGame?: boolean) => {
        this.game = new Arithmetic.window.ArithmeticGame(loadSavedGame);
    }

    protected triggerResize = () => Arithmetic.window.dispatchEvent(new Event("resize"));

    protected toggleFullscreen = () => this.isFullscreen() ? this.exitFullscreen.call(Arithmetic.document).then(this.triggerResize) : this.requestFullscreen.call(this.$rootNode).then(this.triggerResize);
    
	protected isFullscreen = () => Arithmetic.document.fullscreenElement || Arithmetic.document.webkitFullscreenElement || Arithmetic.document.msFullscreenElement || Arithmetic.document.mozFullScreenElement;
}

window.Arithmetic = Arithmetic;
export default Arithmetic;
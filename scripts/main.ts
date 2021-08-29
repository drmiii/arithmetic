interface Window {
	Countdown: Countdown;
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

class Countdown {
	protected document = window.document;
	protected $rootNode = this.document.documentElement;
	protected requestFullscreen: typeof document.documentElement.requestFullscreen = this.$rootNode.requestFullscreen || this.$rootNode.webkitRequestFullscreen || this.$rootNode.msRequestFullscreen || this.$rootNode.mozRequestFullScreen;
	protected exitFullscreen: typeof document.exitFullscreen = this.document.exitFullscreen || this.document.webkitExitFullscreen || this.document.msExitFullscreen || this.document.mozCancelFullScreen;

	protected round!: CountdownRound;

	public constructor() {
		if (!this.requestFullscreen || !this.exitFullscreen) {
			this.$rootNode.classList.add("no-fullscreen");
		}

		this.document.addEventListener("check", console.log);
		this.document.addEventListener("click", this.onClick);
		this.document.addEventListener("keydown", this.onKeydown);

		if (this.document.readyState === "loading") {
			this.document.addEventListener("DOMContentLoaded", () => this.newRound(true));
		} else {
			this.newRound(true);
		}
	}

	//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
	// - horizontal spacing of numbers when less than 6
	// - vertical centering of target and tiles when less than 4
	// - fireworks animation
	// - change the way tiles are structured
	// - debounce firework canvas resize
	// - clearing of fireworks could be better - fade?
	// - possibly use request animation frame to update interface more smoothly and maybe not cause a stutter on shuffle while fireworks are going
	//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

	public newRound = (loadSavedGame?: boolean) => {
		this.round = new CountdownRound(loadSavedGame);
	}

	public toggleFullscreen = () => this.isFullscreen() ? this.exitFullscreen.call(this.document) : this.requestFullscreen.call(this.$rootNode)

	protected onClick = (e: MouseEvent) => {
		if (e.target instanceof Element) {
			if (e.target.closest("#fullscreen")) {
				this.toggleFullscreen();
			} else if (e.target.closest("#shuffle")) {
				this.newRound();
			} else if (e.target.closest("#reset")) {
				this.round.reset();
			} else if (e.target.closest("#undo")) {
				this.round.undo();
			} else if (e.target.closest("#plus")) {
				this.round.add();
			} else if (e.target.closest("#minus")) {
				this.round.subtract();
			} else if (e.target.closest("#times")) {
				this.round.multiply();
			} else if (e.target.closest("#divide")) {
				this.round.divide();
			} else if (e.target.closest('#tiles input[type="checkbox"]')) {
				this.round.toggleOperators();
			}
		}
	}

	protected onKeydown = (e: KeyboardEvent) => {
		const key = e.key ? e.key.toUpperCase() : e.keyCode;
		if ((key === "F11") || (key === 122)) {
			e.preventDefault();
			this.toggleFullscreen();
		} else if (!e.ctrlKey) {
			if ((key === "N") || (key === 78)) {
				e.preventDefault();
				this.newRound();
			} else if ((key === "R") || (key === 82)) {
				e.preventDefault();
				this.round.reset();
			} else if ((key === "U") || (key === 85)) {
				e.preventDefault();
				this.round.undo();
			} else if ((key === "+") || (key === 107) || ((e.shiftKey) && (key === 187))) {
				e.preventDefault();
				this.round.add();
			} else if ((key === "-") || (key === 109) || (key === 189)) {
				e.preventDefault();
				this.round.subtract();
			} else if ((key === "*") || (key === 106) || ((e.shiftKey) && (key === 56))) {
				e.preventDefault();
				this.round.multiply();
			} else if ((key === "/") || (key === 111) || (key === 191)) {
				e.preventDefault();
				this.round.divide();
			}
		}
	}

	protected isFullscreen = () => this.document.fullscreenElement || this.document.webkitFullscreenElement || this.document.msFullscreenElement || this.document.mozFullScreenElement;
}

class CountdownRound {
	protected static _window: Window;
	protected static get window() {
		return CountdownRound._window || (CountdownRound._window = window);
	}

	protected static _localStorage: Storage | null;
	protected static get localStorage() {
		if (CountdownRound._localStorage === undefined) {
			try {
				this._localStorage = CountdownRound.window.localStorage;
				const x = "x";
				CountdownRound.window.localStorage.setItem(x, x);
				CountdownRound.window.localStorage.removeItem(x);
			} catch (ex) {
				this._localStorage = null;
			}
		}
		return CountdownRound._localStorage;
	}

	protected static _game: string;
	protected static get game() {
		if (CountdownRound._game === undefined) {
			const queryString = new URLSearchParams(window.location.search);
			const game = queryString.get("g");
			CountdownRound._game = game ?? "";
		}
		return CountdownRound._game;
	}

	protected static _$rootNode: HTMLElement;
	protected static get $rootNode() {
		return CountdownRound._$rootNode || (CountdownRound._$rootNode = CountdownRound.window.document.documentElement);
	}

	protected static _$round: HTMLElement | null;
	protected static get $round() {
		return CountdownRound._$round || (CountdownRound._$round = CountdownRound.$rootNode.querySelector("#round"));
	}

	protected static _$wins: HTMLElement | null;
	protected static get $wins() {
		return CountdownRound._$wins || (CountdownRound._$wins = CountdownRound.$rootNode.querySelector("#wins"));
	}

	protected static _$target: HTMLElement | null;
	protected static get $target() {
		return CountdownRound._$target || (CountdownRound._$target = CountdownRound.$rootNode.querySelector("#target"));
	}

	protected static _$tiles: Array<HTMLElement>;
	protected static get $tiles() {
		return CountdownRound._$tiles || (CountdownRound._$tiles = Array.from(CountdownRound.$rootNode.querySelectorAll(".tile")));
	}

	protected static _$checkboxes: Array<HTMLInputElement>;
	protected static get $checkboxes() {
		return CountdownRound._$checkboxes || (CountdownRound._$checkboxes = Array.from(CountdownRound.$rootNode.querySelectorAll('#tiles input[type="checkbox"]')));
	}

	protected static _$reset: HTMLButtonElement | null;
	protected static get $reset() {
		return CountdownRound._$reset || (CountdownRound._$reset = CountdownRound.$rootNode.querySelector("#reset"));
	}

	protected static _$undo: HTMLButtonElement | null;
	protected static get $undo() {
		return CountdownRound._$undo || (CountdownRound._$undo = CountdownRound.$rootNode.querySelector("#undo"));
	}

	protected static _$plus: HTMLButtonElement | null;
	protected static get $plus() {
		return CountdownRound._$plus || (CountdownRound._$plus = CountdownRound.$rootNode.querySelector("#plus"));
	}

	protected static _$minus: HTMLButtonElement | null;
	protected static get $minus() {
		return CountdownRound._$minus || (CountdownRound._$minus = CountdownRound.$rootNode.querySelector("#minus"));
	}

	protected static _$times: HTMLButtonElement | null;
	protected static get $times() {
		return CountdownRound._$times || (CountdownRound._$times = CountdownRound.$rootNode.querySelector("#times"));
	}

	protected static _$divide: HTMLButtonElement | null;
	protected static get $divide() {
		return CountdownRound._$divide || (CountdownRound._$divide = CountdownRound.$rootNode.querySelector("#divide"));
	}

	protected get selectedNumbers() {
		// this could be better/faster
		const tiles = Array.from(CountdownRound.$rootNode.querySelectorAll('input[type="checkbox"]:checked + .tile')) as Array<HTMLElement>;
		const numbers = tiles.map(el => parseInt(el.innerText));
		numbers.sort(this.sortIntReverse);
		return numbers;
	}

	protected round!: number;
	protected wins!: number;
	protected target: number;
	protected numbers: Array<Array<number>> = [];
	protected operations: Array<string> = [];

	public constructor(loadSavedGame = false) {
		if (loadSavedGame && CountdownRound.localStorage) {
			this.load();
		}

		this.target = this.randInt(101, 999);

		if (this.numbers.length === 0) {
			const large = [25, 50, 75, 100];
			const small = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
			const numbers = [
				large.splice(this.randInt(large.length), 1)[0],
				this.randInt(0, 1) === 0 ? large.splice(this.randInt(large.length), 1)[0] : small.splice(this.randInt(small.length), 1)[0],
				small.splice(this.randInt(small.length), 1)[0],
				small.splice(this.randInt(small.length), 1)[0],
				small.splice(this.randInt(small.length), 1)[0],
				small.splice(this.randInt(small.length), 1)[0],
			];
			numbers.sort(this.sortIntReverse);
			this.numbers = [numbers];
		}

		this.save();
		this.updateInterface();
	}

	public reset = () => {
		this.numbers = [this.numbers[0]];
		this.operations = [];
		this.save();
		this.updateInterface();
	}

	public undo = () => {
		if (this.numbers.length > 1) {
			this.numbers = this.numbers.slice(0, -1);
			this.operations = this.operations.slice(0, -1);
			this.save();
			this.updateInterface();
		}
	}

	public toggleOperators = () => {
		const selectedNumbers = this.selectedNumbers;
		CountdownRound.$plus && (CountdownRound.$plus.disabled = !this.additive(selectedNumbers));
		CountdownRound.$minus && (CountdownRound.$minus.disabled = !this.subtractive(selectedNumbers));
		CountdownRound.$times && (CountdownRound.$times.disabled = !this.multiplicative(selectedNumbers));
		CountdownRound.$divide && (CountdownRound.$divide.disabled = !this.divisible(selectedNumbers));
	}

	public add = (...addends: Array<number>) => {
		if (addends.length === 0) {
			addends = this.selectedNumbers;
		}
		const numbers = this.numbers[this.numbers.length - 1].slice();
		if (addends.every(v => numbers.includes(v)) && this.additive(addends)) {
			let sum = 0;
			for (const addend of addends) {
				sum += addend;
				numbers.splice(numbers.indexOf(addend), 1);
			}
			numbers.push(sum);
			numbers.sort(this.sortIntReverse);

			this.numbers.push(numbers);
			this.operations.push(`${addends.join(" + ")} = ${sum}`);
			this.save();
			this.updateInterface();
		}
	}

	public subtract = (minuend?: number, subtrahend?: number) => {
		if ((minuend === undefined) || (subtrahend === undefined)) {
			[minuend, subtrahend] = this.selectedNumbers;
		}
		const numbers = this.numbers[this.numbers.length - 1].slice();
		if (numbers.includes(minuend) && numbers.includes(subtrahend) && this.subtractive([minuend, subtrahend])) {
			const difference = minuend - subtrahend;
			numbers.splice(numbers.indexOf(minuend), 1);
			numbers.splice(numbers.indexOf(subtrahend), 1);
			numbers.push(difference);
			numbers.sort(this.sortIntReverse);

			this.numbers.push(numbers);
			this.operations.push(`${minuend} \u2212 ${subtrahend} = ${difference}`);
			this.save();
			this.updateInterface();
		}
	}

	public multiply = (...factors: Array<number>) => {
		if (factors.length === 0) {
			factors = this.selectedNumbers;
		}
		const numbers = this.numbers[this.numbers.length - 1].slice();
		if (factors.every(v => numbers.includes(v)) && this.multiplicative(factors)) {
			let product = 1;
			for (const factor of factors) {
				product *= factor;
				numbers.splice(numbers.indexOf(factor), 1);
			}
			numbers.push(product);
			numbers.sort(this.sortIntReverse);

			this.numbers.push(numbers);
			this.operations.push(`${factors.join(" \u00d7 ")} = ${product}`);
			this.save();
			this.updateInterface();
		}
	}

	public divide = (dividend?: number, divisor?: number) => {
		if ((dividend === undefined) || (divisor === undefined)) {
			[dividend, divisor] = this.selectedNumbers;
		}
		const numbers = this.numbers[this.numbers.length - 1].slice();
		if (numbers.includes(dividend) && numbers.includes(divisor) && this.divisible([dividend, divisor])) {
			const quotient = dividend / divisor;
			numbers.splice(numbers.indexOf(dividend), 1);
			numbers.splice(numbers.indexOf(divisor), 1);
			numbers.push(quotient);
			numbers.sort(this.sortIntReverse);

			this.numbers.push(numbers);
			this.operations.push(`${dividend} \u00f7 ${divisor} = ${quotient}`);
			this.save();
			this.updateInterface();
		}
	}

	protected load = () => {
		try {
			const prefix = CountdownRound.game ? `Countdown.${CountdownRound.game}.` : "Countdown";
			const roundJson = CountdownRound.localStorage?.getItem(`${prefix}.Round`);
			const winsJson = CountdownRound.localStorage?.getItem(`${prefix}.Wins`);
			const targetJson = CountdownRound.localStorage?.getItem(`${prefix}.Target`);
			const numbersJson = CountdownRound.localStorage?.getItem(`${prefix}.Numbers`);
			const operationsJson = CountdownRound.localStorage?.getItem(`${prefix}.Operations`);
			const round = JSON.parse(roundJson ?? "");
			const wins = JSON.parse(winsJson ?? "");
			const target = JSON.parse(targetJson ?? "");
			const numbers = JSON.parse(numbersJson ?? "");
			const operations = JSON.parse(operationsJson ?? "");

			if (!Number.isInteger(round) || !Number.isInteger(wins) || !Number.isInteger(target) || !Array.isArray(numbers) || !Array.isArray(operations)) {
				return;
			}

			if ((round < 0) || (wins < 0) || (target < 100) || (target > 999) || (numbers.length !== operations.length + 1)) {
				return;
			}

			if (numbers.some(a => !Array.isArray(a) || a.some(n => !Number.isInteger(n)))) {
				return;
			}

			if (operations.some(s => (typeof s !== "string") || (s.length === 0))) {
				return;
			}

			this.round = round;
			this.wins = wins;
			this.target = target;
			this.numbers = numbers;
			this.operations = operations;
		} catch (ex) { }
	}

	protected save = () => {
		if (CountdownRound.localStorage) {
			try {
				const prefix = CountdownRound.game ? `Countdown.${CountdownRound.game}.` : "Countdown";
				const roundJson = JSON.stringify(this.round);
				const winsJson = JSON.stringify(this.wins);
				const targetJson = JSON.stringify(this.target);
				const numbersJson = JSON.stringify(this.numbers);
				const operationsJson = JSON.stringify(this.operations);
				CountdownRound.localStorage.setItem(`${prefix}.Round`, roundJson);
				CountdownRound.localStorage.setItem(`${prefix}.Wins`, winsJson);
				CountdownRound.localStorage.setItem(`${prefix}.Target`, targetJson);
				CountdownRound.localStorage.setItem(`${prefix}.Numbers`, numbersJson);
				CountdownRound.localStorage.setItem(`${prefix}.Operations`, operationsJson);
			} catch (ex) { }
		}
	}

	protected updateInterface = () => {
		CountdownRound.$target && (CountdownRound.$target.innerText = `${this.target}`);

		const numbers = this.numbers[this.numbers.length - 1].slice();
		if ("Feuerwerke" in CountdownRound.window) {
			if (numbers.includes(this.target)) {
				(CountdownRound.window.Feuerwerke as any).start();
			} else {
				(CountdownRound.window.Feuerwerke as any).stop();
			}
		}
		for (const $el of CountdownRound.$tiles) {
			const n = numbers.shift();
			$el.classList.toggle("hidden", n === undefined);
			$el.classList.toggle("condensed", n !== undefined && n >= 10);
			$el.classList.toggle("extra", n !== undefined && n >= 100);
			$el.innerText = `${n || ""}`;
		}
		for (const $el of CountdownRound.$checkboxes) {
			$el.checked = false;
		}

		const disabled = this.operations.length === 0;
		CountdownRound.$reset && (CountdownRound.$reset.disabled = disabled);
		CountdownRound.$undo && (CountdownRound.$undo.disabled = disabled);
		this.toggleOperators();
	}

	protected additive = (numbers: Array<number>) => {
		return numbers.length > 1;
	}

	protected subtractive = (numbers: Array<number>) => {
		return (numbers.length === 2) && (numbers[0] > numbers[1]);
	}

	protected multiplicative = (numbers: Array<number>) => {
		return numbers.length > 1;
	}

	protected divisible = (numbers: Array<number>) => {
		return (numbers.length === 2) && (numbers[0] % numbers[1] === 0);
	}

	//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316
	protected randInt(min: number, max: number): number;
	protected randInt(count: number): number;
	protected randInt(min: number, max?: number) {
		if (max === undefined) {
			max = min - 1;
			min = 0;
		}
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * ((max - min) + 1)) + min;
	}

	protected sortIntReverse = (x: number, y: number) => y - x;
}

window.Countdown = new Countdown();

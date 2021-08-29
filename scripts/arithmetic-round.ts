import type Utilities from "./utilities";

class ArithmeticRound {
	protected static targetMin = 101 as const;
	protected static targetMax = 999 as const;
	protected static operandCount = 6 as const;
	protected static largeProbabilities = [.01, .4, .5, .08, .01];
	protected static large = [25, 50, 75, 100] as const;
	protected static small = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10] as const;

	public get solved() {
		const operands = this.operands[this.operands.length - 1].slice();
		return operands.includes(this.target);
	}

    protected static initialized: boolean;
	protected static window: Window;
	protected static Utilities: typeof Utilities;
	protected static $rootNode: HTMLElement;
	protected static $target: HTMLElement | null;
	protected static $operandDisplays: Array<HTMLElement>;
	protected static $reset: HTMLButtonElement | null;
	protected static $undo: HTMLButtonElement | null;
	protected gameId: string;
	protected roundNumber: number;
	protected target!: number;
	protected operands!: Array<Array<number>>;
	protected operations: Array<string> = [];

    public constructor(gameId: string, roundNumber: number, loadSavedRound = false) {
        if (!ArithmeticRound.initialized) {
			ArithmeticRound.window = window;
			ArithmeticRound.Utilities = ArithmeticRound.window.Utilities;
            ArithmeticRound.$rootNode = document.documentElement;
			ArithmeticRound.$target = ArithmeticRound.$rootNode.querySelector('[data-display="target"]');
			ArithmeticRound.$operandDisplays = Array.from(ArithmeticRound.$rootNode.querySelectorAll('[data-display="operand"]'));
            ArithmeticRound.$reset = ArithmeticRound.$rootNode.querySelector('button[data-action="reset"]');
			ArithmeticRound.$undo = ArithmeticRound.$rootNode.querySelector('button[data-action="undo"]');
			ArithmeticRound.initialized = true;
		}

		const r = new ArithmeticRound.window.Random(`${gameId}${roundNumber}`);
		this.gameId = gameId;
		this.roundNumber = roundNumber;

		if (loadSavedRound) {
			this.load();
		}

		if (this.target === undefined) {
			this.target = r.randInt(ArithmeticRound.targetMin, ArithmeticRound.targetMax);
		}

		if (!this.operands?.length) {
			const large = ArithmeticRound.large.slice();
			const small = ArithmeticRound.small.slice();
			const operands = [];
			const largeCount = r.randIntWeighted(...ArithmeticRound.largeProbabilities);
			for (let i = 0; i < ArithmeticRound.operandCount; i++) {
				if (i < largeCount) {
					operands.push(large.splice(r.randInt(0, large.length - 1), 1)[0]);
				} else {
					operands.push(small.splice(r.randInt(0, small.length - 1), 1)[0]);
				}
			}
			operands.sort(ArithmeticRound.Utilities.sortIntReverse);
			this.operands = [operands];
		} 
		this.save();
		this.update();
    }

    public reset = () => {
		this.operands = [this.operands[0]];
		this.operations = [];
		this.save();
		this.update();
    }

    public undo = () => {
		if (this.operands.length > 1) {
			this.operands = this.operands.slice(0, -1);
			this.operations = this.operations.slice(0, -1);
			this.save();
			this.update();
			return true;
		}
		return false;
	}
	
	public add = (...addends: Array<number>) => {
		const operands = this.operands[this.operands.length - 1].slice();
		if (addends.every(v => operands.includes(v)) && ArithmeticRound.Utilities.additive(addends)) {
			let sum = 0;
			for (const addend of addends) {
				sum += addend;
				operands.splice(operands.indexOf(addend), 1);
			}
			operands.push(sum);
			operands.sort(ArithmeticRound.Utilities.sortIntReverse);

			this.operands.push(operands);
			this.operations.push(`${addends.join(" + ")} = ${sum}`);
			this.save();
            this.update();
			return true;
		}
		return false;
	}

	public subtract = (minuend: number, subtrahend: number) => {
		const operands = this.operands[this.operands.length - 1].slice();
		if (operands.includes(minuend) && operands.includes(subtrahend) && ArithmeticRound.Utilities.subtractive([minuend, subtrahend])) {
			const difference = minuend - subtrahend;
			operands.splice(operands.indexOf(minuend), 1);
			operands.splice(operands.indexOf(subtrahend), 1);
			operands.push(difference);
			operands.sort(ArithmeticRound.Utilities.sortIntReverse);

			this.operands.push(operands);
			this.operations.push(`${minuend} \u2212 ${subtrahend} = ${difference}`);
			this.save();
            this.update();
			return true;
		}
		return false;
	}

	public multiply = (...factors: Array<number>) => {
		const operands = this.operands[this.operands.length - 1].slice();
		if (factors.every(v => operands.includes(v)) && ArithmeticRound.Utilities.multiplicative(factors)) {
			let product = 1;
			for (const factor of factors) {
				product *= factor;
				operands.splice(operands.indexOf(factor), 1);
			}
			operands.push(product);
			operands.sort(ArithmeticRound.Utilities.sortIntReverse);

			this.operands.push(operands);
			this.operations.push(`${factors.join(" \u00d7 ")} = ${product}`);
			this.save();
            this.update();
			return true;
		}
		return false;
	}

	public divide = (dividend: number, divisor: number) => {
		const operands = this.operands[this.operands.length - 1].slice();
		if (operands.includes(dividend) && operands.includes(divisor) && ArithmeticRound.Utilities.divisible([dividend, divisor])) {
			const quotient = dividend / divisor;
			operands.splice(operands.indexOf(dividend), 1);
			operands.splice(operands.indexOf(divisor), 1);
			operands.push(quotient);
			operands.sort(ArithmeticRound.Utilities.sortIntReverse);

			this.operands.push(operands);
			this.operations.push(`${dividend} \u00f7 ${divisor} = ${quotient}`);
			this.save();
            this.update();
			return true;
		}
		return false;
	}

	protected load = () => {
        const data = ArithmeticRound.Utilities.load(["roundNumber", "target", "operands", "operations"], `Arithmetic.${btoa(this.gameId)}.`)

		if (!Number.isInteger(data.roundNumber) || !Number.isInteger(data.target) || !Array.isArray(data.operands) || !Array.isArray(data.operations)) {
			return;
		}

		if ((data.target < 100) || (data.target > 999) || (data.operands.length !== data.operations.length + 1)) {
			return;
		}

		if (data.operands.some(a => !Array.isArray(a) || a.some(n => !Number.isInteger(n)))) {
			return;
		}

		if (data.operations.some(s => (typeof s !== "string") || (s.length === 0))) {
			return;
		}

		this.target = data.target;
		this.operands = data.operands;
		this.operations = data.operations;
    }

	protected save = () => {
        const data = {
			roundNumber: this.roundNumber,
            target: this.target,
            operands: this.operands,
            operations: this.operations,
        };
        ArithmeticRound.Utilities.save(data, `Arithmetic.${btoa(this.gameId)}.`)
    }

    protected update = () => {
		if (ArithmeticRound.$target) {
			ArithmeticRound.$target.innerText = `${this.target}`;
		}
		const operands = this.operands[this.operands.length - 1].slice();
		for (let i = 0; i < ArithmeticRound.operandCount; i++) {
			const n = operands[i];
			const $operand = ArithmeticRound.$operandDisplays[i];
			$operand.classList.toggle("hidden", n === undefined);
			$operand.classList.toggle("condensed", n >= 10);
			$operand.classList.toggle("extra", n >= 100);
			$operand.innerText = `${n ?? ""}`;
		}

		const disabled = this.operations.length === 0;
		if (ArithmeticRound.$reset && ArithmeticRound.$undo) {
			ArithmeticRound.$reset.disabled = disabled;
			ArithmeticRound.$undo.disabled = disabled;
		}
    }
}

window.ArithmeticRound = ArithmeticRound;
export default ArithmeticRound;
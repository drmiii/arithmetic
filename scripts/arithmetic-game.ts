import type ArithmeticRound from "./arithmetic-round";
import type Utilities from "./utilities";

class ArithmeticGame {
    protected static idParameter = "g" as const;

	protected get selectedOperands() {
		const operands = ArithmeticGame.$operandActions.reduce<Array<number>>((operands, $operand, i) => {
            if ($operand.checked) {
                operands.push(parseInt(ArithmeticGame.$operandDisplays[i].innerText));
            }
            return operands;
        }, []);
		operands.sort(ArithmeticGame.Utilities.sortIntReverse);
		return operands;
	}
    
    protected static initialized: boolean;
	protected static window: Window;
	protected static document: Document;
	protected static Utilities: typeof Utilities;
	protected static $rootNode: HTMLElement;
	protected static $wins: HTMLElement | null;
	protected static $round: HTMLElement | null;
	protected static $operandActions: Array<HTMLInputElement>;
	protected static $operandDisplays: Array<HTMLInputElement>;
	protected static $add: HTMLButtonElement | null;
	protected static $subtract: HTMLButtonElement | null;
	protected static $multiply: HTMLButtonElement | null;
	protected static $divide: HTMLButtonElement | null;
    protected gameId: string;
    protected rounds!: Array<{ solved?: boolean; }>;
    protected round!: ArithmeticRound;
    
    public constructor(loadSavedGame = false) {
        if (!ArithmeticGame.initialized) {
            ArithmeticGame.window = window;
            ArithmeticGame.document = ArithmeticGame.window.document;
            ArithmeticGame.Utilities = ArithmeticGame.window.Utilities;
            ArithmeticGame.$rootNode = ArithmeticGame.document.documentElement;
            ArithmeticGame.$wins = ArithmeticGame.$rootNode.querySelector('[data-display="wins"]');
            ArithmeticGame.$round = ArithmeticGame.$rootNode.querySelector('[data-display="round"]');
			ArithmeticGame.$operandActions = Array.from(ArithmeticGame.$rootNode.querySelectorAll('input[type="checkbox"][data-action="operand"]'));
			ArithmeticGame.$operandDisplays = Array.from(ArithmeticGame.$rootNode.querySelectorAll('[data-display="operand"]'));
            ArithmeticGame.$add = ArithmeticGame.$rootNode.querySelector('button[data-action="add"]');
            ArithmeticGame.$subtract = ArithmeticGame.$rootNode.querySelector('button[data-action="subtract"]');
            ArithmeticGame.$multiply = ArithmeticGame.$rootNode.querySelector('button[data-action="multiply"]');
            ArithmeticGame.$divide = ArithmeticGame.$rootNode.querySelector('button[data-action="divide"]');
			ArithmeticGame.initialized = true;
        }

        this.gameId = this.getGameId();

		if (loadSavedGame) {
			this.load();
        }
        
        if (!this.rounds?.length) {
            this.rounds = [{}];
        }

        this.newRound(loadSavedGame);

        this.sync();
        this.save();
        this.update();
    }

    public newRound = (loadSavedRound?: boolean) => {
        if (!loadSavedRound) {
            this.rounds.push({});
        }
        this.round = new ArithmeticGame.window.ArithmeticRound(this.gameId, this.rounds.length, loadSavedRound);
        this.sync();
        this.save();
		this.update();
    }

    public reset = () => {
        this.round.reset();
        this.sync();
        this.save();
		this.update();
    }

    public undo = () => {
		if (this.round.undo()) {
            this.sync();
			this.save();
			this.update();
		}
	}
	
    public add = () => {
        if (this.round.add(...this.selectedOperands)) {
            this.sync();
            this.save();
            this.update();
            return true;
        }
        return false;
    }

    public subtract = () => {
        const [minuend, subtrahend] = this.selectedOperands;
        if (this.round.subtract(minuend, subtrahend)) {
            this.sync();
            this.save();
            this.update();
            return true;
        }
        return false;
    }

    public multiply = () => {
        if (this.round.multiply(...this.selectedOperands)) {
            this.sync();
            this.save();
            this.update();
            return true;
        }
        return false;
    }

    public divide = () => {
        const [dividend, divisor] = this.selectedOperands;
        if (this.round.divide(dividend, divisor)) {
            this.sync();
            this.save();
            this.update();
            return true;
        }
        return false;
    }

	public toggleOperators = () => {
        const operands = this.selectedOperands;
        if (ArithmeticGame.$add && ArithmeticGame.$subtract && ArithmeticGame.$multiply && ArithmeticGame.$divide) {
            ArithmeticGame.$add.disabled = !ArithmeticGame.Utilities.additive(operands);
            ArithmeticGame.$subtract.disabled = !ArithmeticGame.Utilities.subtractive(operands);
            ArithmeticGame.$multiply.disabled = !ArithmeticGame.Utilities.multiplicative(operands);
            ArithmeticGame.$divide.disabled = !ArithmeticGame.Utilities.divisible(operands);
        }
    }
    
    protected getGameId = () => {
        const parameters = new URLSearchParams(ArithmeticGame.window.location.search)
        const gameId = parameters.get(ArithmeticGame.idParameter);
        if (gameId) {
            return gameId;
        }

        const keys = ArithmeticGame.Utilities.getStorageKeys();
        if (keys.length > 0) {
            for (const key of keys) {
                const matches = /^Arithmetic\.(.*?)\..+$/.exec(key);
                if (matches && /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/.test(matches[1])) {
                    return ArithmeticGame.window.atob(matches[1]);
                }
            }
        }
        
        return Date.now().toString();
    }

	protected load = () => {
        const keys = ["rounds"];
        const data = ArithmeticGame.Utilities.load(keys, `Arithmetic.${ArithmeticGame.window.btoa(this.gameId)}.`);

        if (!Array.isArray(data.rounds)) {
            return;
        }

        this.rounds = data.rounds;
    }

    protected sync = () => {
        if (this.round.solved) {
            this.rounds[this.rounds.length - 1].solved = true;
        } else {
            delete this.rounds[this.rounds.length - 1].solved;
        }
    }

	protected save = () => {
        const data = {
            rounds: this.rounds,
        };
        ArithmeticGame.Utilities.save(data, `Arithmetic.${btoa(this.gameId)}.`);
    }

    protected update = () => {
        if ("feuerwerke" in ArithmeticGame.window) {
			if (this.rounds[this.rounds.length - 1].solved) {
				ArithmeticGame.window.feuerwerke.start();
			} else {
				ArithmeticGame.window.feuerwerke.stop();
			}
        }
        
        if (ArithmeticGame.$wins && ArithmeticGame.$round) {
            ArithmeticGame.$wins.textContent = this.rounds.filter(r => r.solved).length.toString();
            ArithmeticGame.$round.textContent = this.rounds.length.toString();
        }
        
		for (const $operand of ArithmeticGame.$operandActions) {
			$operand.checked = false;
        }
        
		this.toggleOperators();
    }
}

window.ArithmeticGame = ArithmeticGame;
export default ArithmeticGame;
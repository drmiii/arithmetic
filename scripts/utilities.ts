class Utilities {
	protected static _window: Window;
	protected static get window() {
		return Utilities._window || (Utilities._window = window);
    }
    
	protected static _localStorage: Storage | null;
	protected static get localStorage() {
		if (Utilities._localStorage === undefined) {
			try {
				Utilities._localStorage = Utilities.window.localStorage;
				const x = "x";
				Utilities.window.localStorage.setItem(x, x);
				Utilities.window.localStorage.removeItem(x);
			} catch (ex) {
				Utilities._localStorage = null;
			}
		}
		return Utilities._localStorage;
	}
	
	public static getStorageKeys() {
        if (Utilities.localStorage) {
			try {
				return Object.keys(Utilities.localStorage);
			} catch (ex) { }
        }
        return [];
	}

	public static load(keys: Array<string>, prefix = ""): { [T in typeof keys[number]]: any } {
        if (Utilities.localStorage) {
            try {
                const data: { [key: string]: any } = {};
                for (const k of keys) {
                    const json = Utilities.localStorage.getItem(`${prefix}${k}`);
                    if (json) {
                        data[k] = JSON.parse(json);
                    }
                }
                return data;
            } catch (ex) { }
        }
        return {};
    }

	public static save(data: { [key: string]: any }, prefix = "") {
        if (Utilities.localStorage) {
            try {
                for (const [k, v] of Object.entries(data)) {
                    const json = JSON.stringify(v);
                    Utilities.localStorage.setItem(`${prefix}${k}`, json);
                }
            } catch (ex) { }
        }
    }

	public static sortIntReverse = (x: number, y: number) => y - x;

	public static additive(numbers: Array<number>) {
		return numbers.length > 1;
	}

	public static subtractive(numbers: Array<number>) {
		return (numbers.length === 2) && (numbers[0] > numbers[1]);
	}

	public static multiplicative(numbers: Array<number>) {
		return numbers.length > 1;
	}

	public static divisible(numbers: Array<number>) {
		return (numbers.length === 2) && (numbers[0] % numbers[1] === 0);
    }
}

window.Utilities = Utilities;
export default Utilities;
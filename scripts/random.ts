class Random {
    public constructor(seed: string | number) {
		const hash = Random.xmur3a(seed.toString())
		this.rand = Random.sfc32(hash(), hash(), hash(), hash());
	}

    public rand: () => number;
    
	public randInt = (min: number, max: number) => {
		if (max === undefined) {
			max = min - 1;
			min = 0;
		}
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(this.rand() * ((max - min) + 1)) + min;
	}

	public randIntWeighted(...probabilities: Array<number>) {
		const sum = probabilities.reduce((prev, cur) => prev + cur, 0);
		let prev = 0;
		const rand = this.rand() * sum;
		return probabilities.map(cur => prev += cur).findIndex(p => p > rand);
	}

	// https://github.com/bryc/code/blob/master/jshash/PRNGs.md#sfc32
	protected static sfc32(a: number, b: number, c: number, d: number) {
		return () => {
		  a |= 0;
		  b |= 0;
		  c |= 0;
		  d |= 0; 
		  const t = (a + b | 0) + d | 0;
		  d = d + 1 | 0;
		  a = b ^ b >>> 9;
		  b = c + (c << 3) | 0;
		  c = c << 21 | c >>> 11;
		  c = c + t | 0;
		  return (t >>> 0) / 4294967296;
		}
	}
	
	// https://github.com/bryc/code/blob/master/jshash/PRNGs.md#addendum-a-seed-generating-functions
	protected static xmur3a(str: string) {
		const l = str.length;
		let h = 2166136261 >>> 0;
		for (let k, i = 0; i < l; i++) {
			k = Math.imul(str.charCodeAt(i), 3432918353);
			k = k << 15 | k >>> 17;
			h ^= Math.imul(k, 461845907);
			h = h << 13 | h >>> 19;
			h = Math.imul(h, 5) + 3864292196 | 0;
		}
		h ^= l;
		return () => {
			h ^= h >>> 16;
			h = Math.imul(h, 2246822507);
			h ^= h >>> 13;
			h = Math.imul(h, 3266489909);
			h ^= h >>> 16;
			return h >>> 0;
		}
	}
}
window.Random = Random;
export default Random;
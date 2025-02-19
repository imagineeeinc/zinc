// Large Prime Number Gen

// Is it prime?
function isProbablyPrime(n, k = 10) {
	if (n <= 1 || n === 4) return false
	if (n <= 3) return true

	let d = n - 1;
	while (d % 2 === 0) {
		d /= 2;
	}

	// Miller-Rabin test
	for (let i = 0; i < k; i++) {
		if (!millerTest(d, n)) return false
	}
	return true
}

// Miller-Rabin Primality Test
function millerTest(d, n) {
	const a = 2 + Math.floor(Math.random() * (n - 4))
	let x = powerMod(a, d, n)

	if (x === 1 || x === n - 1) return true

	while (d !== n - 1) {
		x = (x * x) % n
		d *= 2

		if (x === 1) return false
		if (x === n - 1) return true
	}

	return false
}

// Fast Exponentiation
function powerMod(base, exponent, mod) {
	let result = 1
	base = base % mod
	while (exponent > 0) {
		if (exponent % 2 === 1) result = (result * base) % mod
		exponent = Math.floor(exponent / 2)
		base = (base * base) % mod
	}
	return result
}

// Generate Large Prime
export function generateLargePrime(bitLength) {
	const min = BigInt(2) ** BigInt(bitLength - 1)
	const max = BigInt(2) ** BigInt(bitLength) - BigInt(1)
	let prime
	do {
		prime = BigInt(Math.floor(Math.random() * Number(max - min + BigInt(1)))) + min
	} while (!isProbablyPrime(Number(prime)))
	return prime
}

// Random 16 byte Number
export function generateRandBase() {
	const array = new Uint16Array(1)
	return BigInt(self.crypto.getRandomValues(array)[0])
}
// Random 8 byte Number
export function generateSecret() {
	const array = new Uint8Array(1)
	return BigInt(self.crypto.getRandomValues(array)[0])
}
// Generate Random Number by Length
export function randomIntByLen(size) {
	const max = (10 ** size) - 1
  let res = Math.floor(Math.random() * max)
	while (res.toString().length < size) {
		res = "0" + res.toString()
	}
	return res
}
import { test } from "node:test";
import assert from "node:assert/strict";
import { IntegerMath as I } from "../src/IntegerMath.ts";

test("modulus is non-negative and safe (bug fix)", () => {
  assert.equal(I.modulus(17, 5), 2);
  assert.equal(I.modulus(-3, 5), 2);
  assert.equal(I.modulus(1e9, 7), 1e9 % 7);
  assert.ok(Number.isNaN(I.modulus(5, 0)));
});

test("gcd / lcm handle zero (bug fix)", () => {
  assert.equal(I.gcd(12, 18), 6);
  assert.equal(I.gcd(0, 5), 5);
  assert.equal(I.gcd(17, 0), 17);
  assert.equal(I.lcm(4, 6), 12);
  assert.equal(I.gcdList([24, 36, 60]), 12);
  assert.equal(I.lcmList([2, 3, 4]), 12);
});

test("prime / composite", () => {
  assert.equal(I.prime(7), true);
  assert.equal(I.prime(1), false);
  assert.equal(I.prime(0), false);
  assert.equal(I.composite(9), true);
  assert.equal(I.composite(7), false);
});

test("factors and proper factors", () => {
  assert.deepEqual([...I.factors(12)], [1, 2, 3, 4, 6, 12]);
  assert.deepEqual([...I.properFactors(12)], [1, 2, 3, 4, 6]);
});

test("primeFactors safe for 0, 1, negatives (bug fix)", () => {
  assert.deepEqual([...I.primeFactors(12)], [2, 2, 3]);
  assert.deepEqual([...I.primeFactors(1)], [1]);
  assert.deepEqual([...I.primeFactors(0)], []);
  assert.deepEqual([...I.primeFactors(-12)], [2, 2, 3]);
  assert.deepEqual([...I.distinctPrimeFactors(12)], [2, 3]);
  assert.deepEqual([...I.primeExponents(12)], [2, 1]);
});

test("totient (bug fix for 1 and primes)", () => {
  assert.equal(I.totient(1), 1);
  assert.equal(I.totient(7), 6);
  assert.equal(I.totient(9), 6);
  assert.equal(I.totient(12), 4);
});

test("perfect / abundance / amicable", () => {
  assert.equal(I.perfect(6), true, "6 = 1+2+3");
  assert.equal(I.perfect(28), true);
  assert.equal(I.abundance(12), 4);
  assert.equal(I.amicable(220, 284), true);
});

test("factorial / permutations / combinations", () => {
  assert.equal(I.factorial(5), 120);
  assert.equal(I.permutations(5, 2), 20);
  assert.equal(I.combinations(5, 2), 10);
});

test("primesTo sieve", () => {
  assert.deepEqual([...I.primesTo(20)], [2, 3, 5, 7, 11, 13, 17, 19]);
});

test("digit manipulation", () => {
  assert.deepEqual(I.toArray(123), [3, 2, 1]);
  assert.equal(I.fromArray([3, 2, 1]), 123);
  assert.equal(I.place(123, 0), 3);
  assert.equal(I.round(1278, 2), 1300);
});

test("list reducers do not mutate input", () => {
  const list = [3, 4, 5];
  I.addList(list);
  I.gcdList(list);
  assert.deepEqual(list, [3, 4, 5]);
});

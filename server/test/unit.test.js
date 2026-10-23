const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { int, str } = require("../src/utils");
test("validate rejects negative, fractional, empty and unsafe IDs", () => {
  for (const value of [-1, 1.5, "", "1 OR 1=1", "9007199254740993"])
    assert.throws(() => int(value));
  assert.equal(int("12"), 12);
  assert.equal(int("0", 0, 1), 0);
});
test("text validation trims and enforces length", () => {
  assert.equal(str(" An ", 2, 20, "Tên"), "An");
  assert.throws(() => str({}, 1, 10, "Tên"));
  assert.throws(() => str("a", 2, 10, "Tên"));
});
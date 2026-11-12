import { test } from "node:test";
import assert from "node:assert/strict";
import { money } from "../src/lib/format.ts";

test("formats USD and UZS the same on every platform", () => {
  assert.equal(money(1234.5, "amazon", "uz"), "$1,234.50");
  assert.equal(money(-2.2, "amazon", "uz"), "−$2.20");
  assert.equal(money(3500000, "uzum", "uz"), "3 500 000 so'm");
  assert.equal(money(60000, "uzum", "ru"), "60 000 сум");
  assert.equal(money(null, "amazon", "uz"), "—");
});

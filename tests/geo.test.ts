import assert from "node:assert/strict";
import test from "node:test";
import { parseBbox, prefectureCodeAt } from "../lib/geo";

test("parseBbox accepts a valid bounding box", () => {
  assert.deepEqual(parseBbox("139,35,140,36"), {
    west: 139,
    south: 35,
    east: 140,
    north: 36,
  });
});

test("parseBbox rejects reversed and out-of-range coordinates", () => {
  assert.equal(parseBbox("140,35,139,36"), null);
  assert.equal(parseBbox("-181,35,140,36"), null);
  assert.equal(parseBbox("139,-91,140,36"), null);
});

test("prefectureCodeAt identifies representative locations", () => {
  assert.equal(prefectureCodeAt(35.6812, 139.7671), "13");
  assert.equal(prefectureCodeAt(34.7025, 135.4959), "27");
});

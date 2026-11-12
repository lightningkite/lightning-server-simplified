import { evaluateCondition, GeoCoordinate } from "../src";

const point = (longitude: number, latitude: number): GeoCoordinate => ({
  type: "Point",
  coordinates: [longitude, latitude],
});

describe("evaluateCondition", () => {
  test("StringContains ignoreCase lowercases both sides", () => {
    const condition = { StringContains: { value: "BOB", ignoreCase: true } };
    expect(evaluateCondition(condition, "Bobby")).toBe(true);
    expect(evaluateCondition({ StringContains: { value: "BOB" } }, "Bobby")).toBe(false);
  });

  test("RegexMatches is unanchored", () => {
    expect(evaluateCondition({ RegexMatches: { pattern: "b+y" } }, "Bobby")).toBe(true);
    expect(evaluateCondition({ RegexMatches: { pattern: "^b" } }, "Bobby")).toBe(false);
    expect(
      evaluateCondition({ RegexMatches: { pattern: "^b", ignoreCase: true } }, "Bobby"),
    ).toBe(true);
  });

  test("CollectionAnyElements and CollectionAllElements", () => {
    expect(evaluateCondition({ CollectionAnyElements: { Equal: 2 } }, [1, 2])).toBe(true);
    expect(evaluateCondition({ CollectionAllElements: { Equal: 2 } }, [1, 2])).toBe(false);
  });

  test("GeoDistance", () => {
    // Claude: one degree of latitude is roughly 111 km.
    const origin = point(0, 0);
    const near = { GeoDistance: { value: origin, lessThan: 112_000 } };
    const far = { GeoDistance: { value: origin, greaterThan: 112_000 } };
    expect(evaluateCondition(near, point(0, 1))).toBe(true);
    expect(evaluateCondition(far, point(0, 1))).toBe(false);
  });
});

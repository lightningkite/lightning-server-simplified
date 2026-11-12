export type Condition<T> =
  | { Never: true }
  | { Always: true }
  | { And: Array<Condition<T>> }
  | { Or: Array<Condition<T>> }
  | { Not: Condition<T> }
  | { Equal: T }
  | { NotEqual: T }
  | { Inside: Array<T> }
  | { NotInside: Array<T> }
  | { GreaterThan: T }
  | { LessThan: T }
  | { GreaterThanOrEqual: T }
  | { LessThanOrEqual: T }
  | { IntBitsClear: number }
  | { IntBitsSet: number }
  | { IntBitsAnyClear: number }
  | { IntBitsAnySet: number }
  | { IfNotNull: Condition<NonNullable<T>> }
  | StringCondition<T>
  | ArrayCondition<T>
  | GeoCondition<T>
  | { [P in keyof T]?: Condition<T[P]> };

type ArrayCondition<T> =
  T extends Array<infer E>
    ?
        | { CollectionAllElements: Condition<E> }
        | { CollectionAnyElements: Condition<E> }
        | { ListAllElements: Condition<E> }
        | { ListAnyElements: Condition<E> }
        | { SetAllElements: Condition<E> }
        | { SetAnyElements: Condition<E> }
    : never;

type StringCondition<T> = T extends string
  ?
      | { StringContains: { value: string; ignoreCase?: boolean } }
      | { RegexMatches: { pattern: string; ignoreCase?: boolean } }
  : never;

/** A GeoJSON point, which is how the server serializes a `GeoCoordinate`. */
export interface GeoCoordinate {
  type: string;
  coordinates: Array<number>;
}

/** Distances are in meters. */
type GeoCondition<T> = T extends GeoCoordinate
  ? { GeoDistance: { value: T; greaterThan?: number; lessThan?: number } }
  : never;

export function evaluateCondition<T>(
  condition: Condition<T>,
  model: T,
): boolean {
  const key = Object.keys(condition)[0];
  const value = (condition as any)[key];
  switch (key) {
    case "Never":
      return false;
    case "Always":
      return true;
    case "And":
      return (value as Array<Condition<T>>).every((x) =>
        evaluateCondition(x, model),
      );
    case "Or":
      return (value as Array<Condition<T>>).some((x) =>
        evaluateCondition(x, model),
      );
    case "Not":
      return !evaluateCondition(value as Condition<T>, model);
    case "Equal":
      return model === value;
    case "NotEqual":
      return model !== value;
    case "Inside":
      return (value as Array<T>).indexOf(model) !== -1;
    case "NotInside":
      return (value as Array<T>).indexOf(model) === -1;
    case "GreaterThan":
      return model > value;
    case "LessThan":
      return model < value;
    case "GreaterThanOrEqual":
      return model >= value;
    case "LessThanOrEqual":
      return model <= value;
    case "StringContains": {
      const v = value as { value: string; ignoreCase?: boolean };
      const text = model as unknown as string;
      if (v.ignoreCase) return text.toLowerCase().includes(v.value.toLowerCase());
      return text.includes(v.value);
    }
    case "RegexMatches": {
      const v = value as { pattern: string; ignoreCase?: boolean };
      return new RegExp(v.pattern, v.ignoreCase ? "i" : "").test(
        model as unknown as string,
      );
    }
    case "GeoDistance": {
      const v = value as {
        value: GeoCoordinate;
        greaterThan?: number;
        lessThan?: number;
      };
      const meters = distanceInMeters(model as unknown as GeoCoordinate, v.value);
      return (
        meters >= (v.greaterThan ?? 0) && meters <= (v.lessThan ?? 100_000_000)
      );
    }
    case "IntBitsClear":
      return ((model as unknown as number) & value) === 0;
    case "IntBitsSet":
      return ((model as unknown as number) & value) === value;
    case "IntBitsAnyClear":
      return ((model as unknown as number) & value) < value;
    case "IntBitsAnySet":
      return ((model as unknown as number) & value) > 0;
    case "CollectionAllElements":
    case "ListAllElements":
    case "SetAllElements":
      return Array.from(model as unknown as Iterable<any>).every((x) =>
        evaluateCondition(value as Condition<any>, x),
      );
    case "CollectionAnyElements":
    case "ListAnyElements":
    case "SetAnyElements":
      return Array.from(model as unknown as Iterable<any>).some((x) =>
        evaluateCondition(value as Condition<any>, x),
      );
    case "IfNotNull":
      return (
        model !== null &&
        model !== undefined &&
        evaluateCondition(value as Condition<any>, model)
      );
    default:
      return evaluateCondition(
        value as Condition<any>,
        (model as unknown as any)[key],
      );
  }
}

// Same spherical-law-of-cosines formula as the server's GeoCoordinate.distanceTo, so mocks agree with it.
function distanceInMeters(a: GeoCoordinate, b: GeoCoordinate): number {
  const [aLon, aLat] = a.coordinates;
  const [bLon, bLat] = b.coordinates;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const cosine =
    Math.sin(rad(aLat)) * Math.sin(rad(bLat)) +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.cos(rad(aLon - bLon));
  const degrees = (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
  const miles = degrees * 60 * 1.1515;
  return miles * 1609.344;
}

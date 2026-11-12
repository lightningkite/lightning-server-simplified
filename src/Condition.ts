/**
 * A filter on values of type `T`, serialized the way the server's `Condition` is.
 *
 * A condition is an object with exactly one key: an operator such as `Equal`, or a field name of `T` whose value is
 * a condition on that field. So `{ address: { city: { Equal: "Provo" } } }` matches values whose `address.city` is
 * `"Provo"`. Which operators are available depends on `T`; see {@link StringCondition}, {@link ArrayCondition}
 * and {@link GeoCondition}.
 *
 * Not every database backend supports every operator; `RegexMatches` in particular may be rejected.
 */
export type Condition<T> =
  | {
      /** Matches nothing. */
      Never: true;
    }
  | {
      /** Matches everything. */
      Always: true;
    }
  | {
      /** Matches when every condition matches, so an empty list matches everything. */
      And: Array<Condition<T>>;
    }
  | {
      /** Matches when any condition matches, so an empty list matches nothing. */
      Or: Array<Condition<T>>;
    }
  | {
      /** Matches when the condition doesn't. */
      Not: Condition<T>;
    }
  | {
      /** Matches values equal to this one. */
      Equal: T;
    }
  | {
      /** Matches values not equal to this one. */
      NotEqual: T;
    }
  | {
      /** Matches values equal to any of these. The server treats the list as a set. */
      Inside: Array<T>;
    }
  | {
      /** Matches values equal to none of these. The server treats the list as a set. */
      NotInside: Array<T>;
    }
  | {
      /** Matches values greater than this one. */
      GreaterThan: T;
    }
  | {
      /** Matches values less than this one. */
      LessThan: T;
    }
  | {
      /** Matches values greater than or equal to this one. */
      GreaterThanOrEqual: T;
    }
  | {
      /** Matches values less than or equal to this one. */
      LessThanOrEqual: T;
    }
  | {
      /** Matches integers where every bit of this mask is `0`. */
      IntBitsClear: number;
    }
  | {
      /** Matches integers where every bit of this mask is `1`. */
      IntBitsSet: number;
    }
  | {
      /** Matches integers where at least one bit of this mask is `0`. */
      IntBitsAnyClear: number;
    }
  | {
      /** Matches integers where at least one bit of this mask is `1`. */
      IntBitsAnySet: number;
    }
  | {
      /** Matches values that aren't `null` and match this condition. */
      IfNotNull: Condition<NonNullable<T>>;
    }
  | StringCondition<T>
  | ArrayCondition<T>
  | GeoCondition<T>
  | { [P in keyof T]?: Condition<T[P]> };

/** The {@link Condition} operators available on strings. */
type StringCondition<T> = T extends string
  ?
      | {
          /** Matches strings that contain `value`, ignoring case when `ignoreCase` is `true`. */
          StringContains: { value: string; ignoreCase?: boolean };
        }
      | {
          /**
           * Matches strings where `pattern` is found anywhere, ignoring case when `ignoreCase` is `true`.
           *
           * The match is unanchored, like MongoDB's `$regex` and Postgres's `~`; anchor the pattern with `^…$` to
           * match the whole string.
           */
          RegexMatches: { pattern: string; ignoreCase?: boolean };
        }
  : never;

/**
 * The {@link Condition} operators available on lists and sets.
 *
 * `CollectionAllElements` and `CollectionAnyElements` are the server's names; the `List` and `Set` forms are aliases
 * it also accepts.
 */
type ArrayCondition<T> =
  T extends Array<infer E>
    ?
        | {
            /** Matches collections whose every element matches this condition, including empty ones. */
            CollectionAllElements: Condition<E>;
          }
        | {
            /** Matches collections with at least one element that matches this condition. */
            CollectionAnyElements: Condition<E>;
          }
        | {
            /** Alias of `CollectionAllElements`. */
            ListAllElements: Condition<E>;
          }
        | {
            /** Alias of `CollectionAnyElements`. */
            ListAnyElements: Condition<E>;
          }
        | {
            /** Alias of `CollectionAllElements`. */
            SetAllElements: Condition<E>;
          }
        | {
            /** Alias of `CollectionAnyElements`. */
            SetAnyElements: Condition<E>;
          }
    : never;

/** A GeoJSON point, which is how the server serializes a `GeoCoordinate`: `coordinates` is `[longitude, latitude]`. */
export interface GeoCoordinate {
  type: string;
  coordinates: Array<number>;
}

/** The {@link Condition} operators available on a {@link GeoCoordinate}. */
type GeoCondition<T> = T extends GeoCoordinate
  ? {
      /**
       * Matches points whose great-circle distance from `value` is between `greaterThan` and
       * `lessThan` meters, inclusive.
       *
       * `greaterThan` defaults to `0` and `lessThan` to 100,000 km.
       */
      GeoDistance: { value: T; greaterThan?: number; lessThan?: number };
    }
  : never;

/**
 * Returns `true` if `model` matches `condition`, evaluated in memory the way the server does.
 */
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
      return ((model as unknown as number) & value) !== value;
    case "IntBitsAnySet":
      return ((model as unknown as number) & value) !== 0;
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

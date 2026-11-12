import { Condition, evaluateCondition } from "./Condition";

/**
 * An update to a value of type `T`, serialized the way the server's `Modification` is.
 *
 * A modification is an object with exactly one key: an operator such as `Assign`, or a field name of `T` whose value
 * is a modification of that field. So `{ address: { city: { Assign: "Provo" } } }` changes only `address.city`.
 * Which operators are available depends on `T`; see {@link ArrayModification}, {@link ComparableModification} and
 * {@link NumberModification}. Those are unavailable on nullable values; wrap them in `IfNotNull` first.
 */
export type Modification<T> =
  | {
      /** Leaves the value unchanged. */
      Nothing: true;
    }
  | {
      /** Replaces the value with this one. */
      Assign: T;
    }
  | {
      /** Applies each modification in order, each to the result of the one before. */
      Chain: Array<Modification<T>>;
    }
  | {
      /** Applies this modification unless the value is `null`, which stays `null`. */
      IfNotNull: Modification<NonNullable<T>>;
    }
  | ArrayModification<T>
  | ComparableModification<T>
  | NumberModification<T>
  | { [P in keyof T]?: Modification<T[P]> };

/**
 * The {@link Modification} operators available on lists and sets.
 *
 * Use the `List` operators on a Kotlin `List` and the `Set` operators on a Kotlin `Set`; the server rejects the
 * other kind.
 */
type ArrayModification<T> = NoNullGuard<
  T,
  T extends Array<infer E>
    ?
        | {
            /** Adds these elements to the end. */
            ListAppend: Array<E>;
          }
        | {
            /** Removes every element that matches this condition. */
            ListRemove: Condition<E>;
          }
        | {
            /** Removes every element equal to one of these. */
            ListRemoveInstances: Array<E>;
          }
        | {
            /** Applies `modification` to every element that matches `condition`. */
            ListPerElement: {
              condition: Condition<E>;
              modification: Modification<E>;
            };
          }
        | {
            /** Adds these elements, skipping any already present. */
            SetAppend: Array<E>;
          }
        | {
            /** Removes every element that matches this condition. */
            SetRemove: Condition<E>;
          }
        | {
            /** Removes these elements. */
            SetRemoveInstances: Array<E>;
          }
        | {
            /** Applies `modification` to every element that matches `condition`. */
            SetPerElement: {
              condition: Condition<E>;
              modification: Modification<E>;
            };
          }
    : never
>;

/** The {@link Modification} operators available on comparable values, such as numbers, strings and dates. */
type ComparableModification<T> = NoNullGuard<
  T,
  T extends string | number
    ?
        | {
            /** Replaces the value with this one if the value is greater. */
            CoerceAtMost: T;
          }
        | {
            /** Replaces the value with this one if the value is less. */
            CoerceAtLeast: T;
          }
    : never
>;

/** The {@link Modification} operators available on numbers. */
type NumberModification<T> = NoNullGuard<
  T,
  T extends number
    ?
        | {
            /** Adds this amount to the value. */
            Increment: T;
          }
        | {
            /** Multiplies the value by this amount. */
            Multiply: T;
          }
    : never
>;

type NoNullGuard<T, V> = [T] extends [Exclude<T, null | undefined>] ? V : never;

/**
 * Returns the result of applying `modification` to `model`, evaluated in memory the way the server does.
 *
 * `model` is not mutated.
 */
export function evaluateModification<T>(
  modification: Modification<T>,
  model: T
): T {
  const keyAndValue = Object.entries(modification).at(0);
  if (!keyAndValue) {
    throw new Error("Single key expected, received none.");
  }
  const [key, value] = keyAndValue;
  switch (key) {
    case "Nothing":
      return model;
    case "Assign":
      return value as T;
    case "Chain":
      let current = model;
      for (const item of value as Array<Modification<T>>)
        current = evaluateModification(item, current);
      return current;
    case "IfNotNull":
      if (model === null || model === undefined) return model;
      return evaluateModification(value as Modification<any>, model);
    case "CoerceAtMost":
      if (typeof model === "string" && typeof value == "string") {
        return model < value ? model : (value as unknown as T);
      }
      if (typeof model === "number" && typeof value == "number") {
        return Math.min(model, value) as unknown as T;
      }
      throw new Error(`CoerceAtMost can't compare ${typeof model} with ${typeof value}`);
    case "CoerceAtLeast":
      if (typeof model === "string" && typeof value == "string") {
        return model > value ? model : (value as unknown as T);
      }
      if (typeof model === "number" && typeof value == "number") {
        return Math.max(model, value) as unknown as T;
      }
      throw new Error(`CoerceAtLeast can't compare ${typeof model} with ${typeof value}`);
    case "Increment": {
      const typedValue = value as number;
      const typedModel = model as unknown as number;
      return (typedModel + typedValue) as unknown as T;
    }
    case "Multiply": {
      const typedValue = value as number;
      const typedModel = model as unknown as number;
      return (typedModel * typedValue) as unknown as T;
    }
    case "ListAppend": {
      const typedValue = value as Array<any>;
      const typedModel = model as unknown as Array<any>;
      return [...typedModel, ...typedValue] as unknown as T;
    }
    case "SetAppend": {
      const typedValue = value as Array<any>;
      const typedModel = model as unknown as Array<any>;
      return [...new Set([...typedModel, ...typedValue])] as unknown as T;
    }
    case "ListRemove":
    case "SetRemove": {
      const typedValue = value as Condition<any>;
      const typedModel = model as unknown as Array<any>;
      return typedModel.filter(
        (item) => !evaluateCondition(typedValue, item)
      ) as unknown as T;
    }
    case "ListRemoveInstances":
    case "SetRemoveInstances": {
      const typedValue = value as Array<any>;
      const typedModel = model as unknown as Array<any>;
      return typedModel.filter((item) => !typedValue.includes(item)) as unknown as T;
    }
    case "ListPerElement":
    case "SetPerElement": {
      const typedValue = value as {
        condition: Condition<any>;
        modification: Modification<any>;
      };
      const typedModel = [...(model as unknown as Array<any>)];

      typedModel.forEach((item, index) => {
        if (evaluateCondition(typedValue.condition, item)) {
          typedModel[index] = evaluateModification(
            typedValue.modification,
            item
          );
        }
      });
      return typedModel as unknown as T;
    }
    default:
      const copy: any = { ...model };
      copy[key] = evaluateModification(
        value as Modification<any>,
        (model as unknown as any)[key]
      );
      return copy;
  }
}
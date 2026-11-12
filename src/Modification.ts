import { Condition, evaluateCondition } from "./Condition";

export type Modification<T> =
  | { Nothing: true }
  | { Assign: T }
  | { Chain: Array<Modification<T>> }
  | { IfNotNull: Modification<NonNullable<T>> }
  | ArrayModification<T>
  | ComparableModification<T>
  | NumberModification<T>
  | { [P in keyof T]?: Modification<T[P]> };

type ArrayModification<T> = NoNullGuard<
  T,
  T extends Array<infer E>
    ?
        | { ListRemove: Condition<E> }
        | { ListAppend: Array<E> }
        | { ListRemoveInstances: Array<E> }
        | { SetAppend: Array<E> }
        | { SetRemove: Condition<E> }
        | { SetRemoveInstances: Array<E> }
        | {
            ListPerElement: {
              condition: Condition<E>;
              modification: Modification<E>;
            };
          }
        | {
            SetPerElement: {
              condition: Condition<E>;
              modification: Modification<E>;
            };
          }
    : never
>;

// Instant, local date, number, string (comparable)
type ComparableModification<T> = NoNullGuard<
  T,
  T extends string | number ? { CoerceAtMost: T } | { CoerceAtLeast: T } : never
>;

type NumberModification<T> = NoNullGuard<
  T,
  T extends number ? { Increment: T } | { Multiply: T } : never
>;

type NoNullGuard<T, V> = [T] extends [Exclude<T, null | undefined>] ? V : never;

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
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
  | { Exists: string }
  | { IfNotNull: Condition<NonNullable<T>> }
  | {
      FullTextSearch: {
        value: string;
        ignoreCase: boolean;
      };
    }
  | StringCondition<T>
  | ArrayCondition<T>
  | { [P in keyof T]?: Condition<T[P]> };

type ArrayCondition<T> =
  T extends Array<infer E>
    ?
        | { ListAllElements: Condition<E> }
        | { ListAnyElements: Condition<E> }
        | { ListSizesEquals: number }
        | { SetAllElements: Condition<E> }
        | { SetAnyElements: Condition<E> }
        | { SetSizesEquals: number }
    : never;

type StringCondition<T> = T extends string
  ? {
      StringContains: {
        value: string;
        ignoreCase: boolean;
      };
    }
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
    case "StringContains":
      const v = value as {
        value: string;
        ignoreCase: boolean;
      };
      if (v.ignoreCase)
        return (
          (model as unknown as string).toLowerCase().indexOf(v.value) !== -1
        );
      else return (model as unknown as string).indexOf(v.value) !== -1;
    case "FullTextSearch":
      const v2 = value as {
        value: string;
        ignoreCase: boolean;
      };
      if (v2.ignoreCase)
        return (
          (model as unknown as string).toLowerCase().indexOf(v2.value) !== -1
        );
      else return (model as unknown as string).indexOf(v2.value) !== -1;
    case "IntBitsClear":
      return ((model as unknown as number) & value) === 0;
    case "IntBitsSet":
      return ((model as unknown as number) & value) === value;
    case "IntBitsAnyClear":
      return ((model as unknown as number) & value) < value;
    case "IntBitsAnySet":
      return ((model as unknown as number) & value) > 0;
    case "ListAllElements":
      return (model as unknown as Array<any>).every((x) =>
        evaluateCondition(value as Condition<any>, x),
      );
    case "ListAnyElements":
      return (model as unknown as Array<any>).some((x) =>
        evaluateCondition(value as Condition<any>, x),
      );
    case "ListSizesEquals":
      return (model as unknown as Array<any>).length === value;
    case "SetAllElements":
      return Array.from(model as unknown as Set<any>).every((x) =>
        evaluateCondition(value as Condition<any>, x),
      );
    case "SetAnyElements":
      return Array.from(model as unknown as Set<any>).some((x) =>
        evaluateCondition(value as Condition<any>, x),
      );
    case "SetSizesEquals":
      return (model as unknown as Set<any>).size === value;
    case "Exists":
      return true;
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

import { Condition } from "../Condition";
import { Modification } from "../Modification";
import { DataClassPath, DataClassPathPartial } from "./DataClassPath";
import { SortPart } from "./SortPart";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * condition: Defaults to {Always: true}
 * skip: Defaults to 0
 * limit: Defaults to 100
 */
export interface Query<T> {
  condition?: Condition<T>;
  orderBy?: Array<SortPart<T>>;
  skip?: number;
  limit?: number;
}

/**
 * condition: Defaults to {Always: true}
 * skip: Defaults to 0
 * limit: Defaults to 100
 */
export interface QueryPartial<T> {
  fields: Array<DataClassPathPartial<T>>;
  condition?: Condition<T>;
  orderBy?: Array<SortPart<T>>;
  skip?: number;
  limit?: number;
}

export interface MassModification<T> {
  condition: Condition<T>;
  modification: Modification<T>;
}
export interface EntryChange<T> {
  old?: T | null;
  new?: T | null;
}
export interface ListChange<T> {
  wholeList?: Array<T> | null;
  old?: T | null;
  new?: T | null;
}
export interface GroupCountQuery<Model> {
  condition?: Condition<Model>;
  groupBy: DataClassPathPartial<Model>;
}

export interface AggregateQuery<Model> {
  aggregate: Aggregate;
  condition?: Condition<Model>;
  property: DataClassPath<Model, number | null | undefined>;
}

export interface GroupAggregateQuery<Model> {
  aggregate: Aggregate;
  condition?: Condition<Model>;
  groupBy: DataClassPathPartial<Model>;
  property: DataClassPath<Model, number | null | undefined>;
}

export type Aggregate =
  | "Sum"
  | "Average"
  | "StandardDeviationSample"
  | "StandardDeviationPopulation";

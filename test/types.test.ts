import { DataClassPath, PathValue, DataClassPathPartial } from "../src";

type Dog = {
  name: string;
  age: number;
  attributes?: {
    color: string;
    breed?: {
      origin: string;
      size: "small" | "medium" | "large";
    };
  };
  owner: {
    name: string;
    email: string;
  };
  rabiesShotsDate: string | null;
  shots?: Array<Shot>;
  list: Array<{
    name: Array<string>;
  }>;
};

type Shot = {
  received: boolean;
  type: string;
  expires: string | null;
};

type _tests = {
  pathValue: [
    Assert<Equals<PathValue<Dog, "name">, string>>,
    Assert<Equals<PathValue<Dog, "age">, number>>,
    Assert<
      Equals<PathValue<Dog, "shots?.*.received">, boolean | null | undefined>
    >,
    Assert<Equals<PathValue<Dog, "list.*.name">, Array<string>>>,
    Assert<
      Equals<
        PathValue<Dog, "attributes?.breed?.size">,
        "small" | "medium" | "large" | null | undefined
      >
    >,
    AssertNot<Equals<PathValue<Dog, "attributes?.breed?.size">, string>>,
  ];
  dataClassPathPartial: [
    Assert<Extends<"attributes?.breed?.origin", DataClassPathPartial<Dog>>>,
    Assert<Extends<"attributes?.breed?.origin", DataClassPathPartial<Dog>>>,
    Assert<Extends<"attributes?.breed", DataClassPathPartial<Dog>>>,
    Assert<Extends<"attributes", DataClassPathPartial<Dog>>>,
    Assert<Extends<"shots?.*.received", DataClassPathPartial<Dog>>>,
    Assert<Extends<"shots?.*.expires", DataClassPathPartial<Dog>>>,
    Assert<Extends<"shots", DataClassPathPartial<Dog>>>,
    AssertNot<Extends<"", DataClassPathPartial<Dog>>>,
    AssertNot<Extends<"attributes?", DataClassPathPartial<Dog>>>,
    AssertNot<Extends<"attributes!.breed", DataClassPathPartial<Dog>>>,
    AssertNot<Extends<"attributes?.breed?.size?", DataClassPathPartial<Dog>>>,
  ];
  dataClassPath: [
    Assert<
      Equals<DataClassPath<Dog, string>, "name" | "owner.name" | "owner.email">
    >,
    AssertNot<Equals<DataClassPath<Dog, string>, "name">>,
  ];
};

type Extends<A, B> = A extends B ? true : false;
type Assert<T extends true> = T;
type AssertNot<T extends false> = T;
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

test("types.test.ts", () => {});

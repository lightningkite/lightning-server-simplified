import { Optic, PathValue, AnyOptic, DataClassPath, DataClassPathPartial } from "../src";

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
    Assert<Extends<"attributes?.breed?.origin", AnyOptic<Dog>>>,
    Assert<Extends<"attributes?.breed?.origin", AnyOptic<Dog>>>,
    Assert<Extends<"attributes?.breed", AnyOptic<Dog>>>,
    Assert<Extends<"attributes", AnyOptic<Dog>>>,
    Assert<Extends<"shots?.*.received", AnyOptic<Dog>>>,
    Assert<Extends<"shots?.*.expires", AnyOptic<Dog>>>,
    Assert<Extends<"shots", AnyOptic<Dog>>>,
    AssertNot<Extends<"", AnyOptic<Dog>>>,
    AssertNot<Extends<"attributes?", AnyOptic<Dog>>>,
    AssertNot<Extends<"attributes!.breed", AnyOptic<Dog>>>,
    AssertNot<Extends<"attributes?.breed?.size?", AnyOptic<Dog>>>,
  ];
  dataClassPath: [
    Assert<
      Equals<Optic<Dog, string>, "name" | "owner.name" | "owner.email">
    >,
    AssertNot<Equals<Optic<Dog, string>, "name">>,
  ];
  deprecatedAliases: [
    Assert<Equals<DataClassPath<Dog, string>, Optic<Dog, string>>>,
    Assert<Equals<DataClassPathPartial<Dog>, AnyOptic<Dog>>>,
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

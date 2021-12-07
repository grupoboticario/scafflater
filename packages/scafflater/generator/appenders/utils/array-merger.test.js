const arrayMerge = require("./array-merger");
const merge = require("deepmerge");

const obj1 = {
  arr: [
    {
      prop1: 1,
    },
    {
      prop2: "test",
    },
  ],
};

const obj2 = {
  arr: [
    {
      prop1: 2,
    },
    {
      prop1: 3,
    },
  ],
};

test("Combine Merge", () => {
  // ACT
  const result = merge(obj1, obj2, {
    arrayMerge,
    strategy: "combine",
  });

  // ASSERT
  expect(result).toStrictEqual({
    arr: [
      {
        prop1: 2,
      },
      {
        prop1: 3,
        prop2: "test",
      },
    ],
  });
});

test("Concat Merge", () => {
  // ACT
  const result = merge(obj1, obj2, {
    arrayMerge,
    strategy: "concat",
  });

  // ASSERT
  expect(result).toStrictEqual({
    arr: [
      {
        prop1: 1,
      },
      {
        prop2: "test",
      },
      {
        prop1: 2,
      },
      {
        prop1: 3,
      },
    ],
  });
});

test("Replace Merge", () => {
  // ACT
  const result = merge(obj1, obj2, {
    arrayMerge,
    strategy: "replace",
  });

  // ASSERT
  expect(result).toStrictEqual({
    arr: [
      {
        prop1: 2,
      },
      {
        prop1: 3,
      },
    ],
  });
});

test("Ignore Merge with not empty array on target.", () => {
  // ACT
  const result = merge(obj1, obj2, {
    arrayMerge,
    strategy: "ignore",
  });

  // ASSERT
  expect(result).toStrictEqual({
    arr: [
      {
        prop1: 1,
      },
      {
        prop2: "test",
      },
    ],
  });
});

test("Ignore Merge with empty array on target.", () => {
  // ACT
  const result = merge({ arr: [] }, obj2, {
    arrayMerge,
    strategy: "ignore",
  });

  // ASSERT
  expect(result).toStrictEqual({
    arr: [
      {
        prop1: 2,
      },
      {
        prop1: 3,
      },
    ],
  });
});

test("key merge", () => {
  // ARRANGE
  const arrObj1 = {
    arr: [
      {
        key: 1,
        prop: "obj1.prop[1]",
      },
      {
        key: 2,
        prop: "obj1.prop[2]",
      },
    ],
  };

  const arrObj2 = {
    arr: [
      {
        key: 1,
        prop: "obj2.prop[1]",
      },
      {
        key: 3,
        prop: "obj2.prop[3]",
      },
    ],
  };

  // ACT
  const result = merge(arrObj1, arrObj2, {
    arrayMerge,
    strategy: "key(key)",
  });

  // ASSERT
  expect(result).toStrictEqual({
    arr: [
      {
        key: 1,
        prop: "obj2.prop[1]",
      },
      {
        key: 2,
        prop: "obj1.prop[2]",
      },
      {
        key: 3,
        prop: "obj2.prop[3]",
      },
    ],
  });
});

test("key merge using name", () => {
  // ARRANGE
  const arrObj1 = {
    arr: [
      {
        key: 1,
        prop: "obj1.prop[1]",
      },
      {
        key: 2,
        prop: "obj1.prop[2]",
      },
    ],
  };

  const arrObj2 = {
    arr: [
      {
        key: 1,
        prop: "obj2.prop[1]",
      },
      {
        key: 3,
        prop: "obj2.prop[3]",
      },
    ],
  };

  // ACT
  const result = merge(arrObj1, arrObj2, {
    arrayMerge,
    strategy: "key",
  });

  // ASSERT
  expect(result).toStrictEqual({
    arr: [
      {
        key: 1,
        prop: "obj2.prop[1]",
      },
      {
        key: 2,
        prop: "obj1.prop[2]",
      },
      {
        key: 3,
        prop: "obj2.prop[3]",
      },
    ],
  });
});

const {
  getProperty,
  setProperty,
  hasProperty,
  deleteProperty,
  escapePath,
  deepKeys,
} = require("./dot-prop");

test("getProperty", () => {
  const fixture1 = { foo: { bar: 1 } };
  expect(getProperty(fixture1)).toBe(fixture1);
  fixture1[""] = "foo";
  expect(getProperty(fixture1, "")).toBe("foo");
  expect(getProperty(fixture1, "foo")).toBe(fixture1.foo);
  expect(getProperty({ foo: 1 }, "foo")).toBe(1);
  expect(getProperty({ foo: null }, "foo")).toBe(null);
  expect(getProperty({ foo: undefined }, "foo")).toBe(undefined);
  expect(getProperty({ foo: { bar: true } }, "foo.bar")).toBeTruthy();
  expect(
    getProperty({ foo: { bar: { baz: true } } }, "foo.bar.baz")
  ).toBeTruthy();
  expect(getProperty({ foo: { bar: { baz: null } } }, "foo.bar.baz")).toBe(
    null
  );
  expect(getProperty({ foo: { bar: "a" } }, "foo.fake")).toBe(undefined);
  expect(getProperty({ foo: { bar: "a" } }, "foo.fake.fake2")).toBe(undefined);
  expect(
    getProperty({ foo: { bar: "a" } }, "foo.fake.fake2", "some value")
  ).toBe("some value");
  expect(getProperty({ foo: {} }, "foo.fake", "some value")).toBe("some value");
  expect(getProperty({ "\\": true }, "\\")).toBeTruthy();
  expect(getProperty({ "\\foo": true }, "\\foo")).toBeTruthy();
  expect(getProperty({ "\\foo": true }, "\\\\foo")).toBeTruthy();
  expect(getProperty({ "foo\\": true }, "foo\\\\")).toBeTruthy();
  expect(getProperty({ "bar\\": true }, "bar\\")).toBeTruthy();
  expect(getProperty({ "foo\\bar": true }, "foo\\bar")).toBeTruthy();
  expect(getProperty({ "\\": { foo: true } }, "\\\\.foo")).toBeTruthy();
  expect(getProperty({ "bar\\.": true }, "bar\\\\\\.")).toBeTruthy();
  expect(
    getProperty(
      {
        "foo\\": {
          bar: true,
        },
      },
      "foo\\\\.bar"
    )
  ).toBeTruthy();
  expect(getProperty({ foo: 1 }, "foo.bar")).toBe(undefined);
  expect(getProperty({ "foo\\": true }, "foo\\")).toBeTruthy();

  const fixture2 = {};
  Object.defineProperty(fixture2, "foo", {
    value: "bar",
    enumerable: false,
  });
  expect(getProperty(fixture2, "foo")).toBe("bar");
  expect(getProperty({}, "hasOwnProperty")).toBe(
    Object.prototype.hasOwnProperty
  );

  /**
   *
   */
  function fn() {}
  fn.foo = { bar: 1 };
  expect(getProperty(fn)).toBe(fn);
  expect(getProperty(fn, "foo")).toBe(fn.foo);
  expect(getProperty(fn, "foo.bar")).toBe(1);

  const f3 = { foo: null };
  expect(getProperty(f3, "foo.bar")).toBe(undefined);
  expect(getProperty(f3, "foo.bar", "some value")).toBe("some value");

  expect(
    getProperty({ "foo.baz": { bar: true } }, "foo\\.baz.bar")
  ).toBeTruthy();
  expect(
    getProperty({ "fo.ob.az": { bar: true } }, "fo\\.ob\\.az.bar")
  ).toBeTruthy();

  expect(getProperty(null, "foo.bar", false)).toBeFalsy();
  expect(getProperty("foo", "foo.bar", false)).toBeFalsy();
  expect(getProperty([], "foo.bar", false)).toBeFalsy();
  expect(getProperty(undefined, "foo.bar", false)).toBeFalsy();

  class F4Class {}
  F4Class.prototype.foo = 1;
  const f4 = new F4Class();
  expect(getProperty(f4, "foo")).toBe(1); // #46

  expect(getProperty({ "": { "": { "": true } } }, "..")).toBeTruthy();
  expect(getProperty({ "": { "": true } }, ".")).toBeTruthy();
});

test("getProperty - with array indexes", () => {
  expect(getProperty([true, false, false], "[0]")).toBeTruthy();
  expect(
    getProperty([[false, true, false], false, false], "[0][1]")
  ).toBeTruthy();
  expect(getProperty([{ foo: [true] }], "[0].foo[0]")).toBeTruthy();
  expect(getProperty({ foo: [0, { bar: true }] }, "foo[1].bar")).toBeTruthy();

  expect(getProperty(["a", "b", "c"], "3", false)).toBeFalsy();
  expect(getProperty([{ foo: [1] }], "[0].bar[0]", false)).toBeFalsy();
  expect(getProperty([{ foo: [1] }], "[0].foo[1]", false)).toBeFalsy();
  expect(
    getProperty({ foo: [0, { bar: 2 }] }, "foo[0].bar", false)
  ).toBeFalsy();
  expect(
    getProperty({ foo: [0, { bar: 2 }] }, "foo[2].bar", false)
  ).toBeFalsy();
  expect(
    getProperty({ foo: [0, { bar: 2 }] }, "foo[1].biz", false)
  ).toBeFalsy();
  expect(
    getProperty({ foo: [0, { bar: 2 }] }, "bar[0].bar", false)
  ).toBeFalsy();
  expect(
    getProperty(
      {
        bar: {
          "[0]": true,
        },
      },
      "bar.\\[0]"
    )
  ).toBeTruthy();
  expect(
    getProperty(
      {
        bar: {
          "": [true],
        },
      },
      "bar.[0]"
    )
  ).toBeTruthy();
  expect(() =>
    getProperty(
      {
        "foo[5[": true,
      },
      "foo[5["
    )
  ).toThrowError("Invalid character in an index");
  expect(() =>
    getProperty(
      {
        "foo[5": {
          bar: true,
        },
      },
      "foo[5.bar"
    )
  ).toThrowError("Invalid character in an index");
  expect(
    getProperty(
      {
        "foo[5]": {
          bar: true,
        },
      },
      "foo\\[5].bar"
    )
  ).toBeTruthy();
  expect(() =>
    getProperty(
      {
        "foo[5\\]": {
          bar: true,
        },
      },
      "foo[5\\].bar"
    )
  ).toThrowError("Invalid character in an index");
  expect(() =>
    getProperty(
      {
        "foo[5": true,
      },
      "foo[5"
    )
  ).toThrowError("Index was not closed");
  expect(() =>
    getProperty(
      {
        "foo[bar]": true,
      },
      "foo[bar]"
    )
  ).toThrowError("Invalid character in an index");
  expect(getProperty({}, "constructor[0]", false)).toBeFalsy();
  expect(() => getProperty({}, "foo[constructor]", false)).toThrow(
    "Invalid character in an index"
  );

  expect(getProperty([], "foo[0].bar", false)).toBeFalsy();
  expect(getProperty({ foo: [{ bar: true }] }, "foo[0].bar")).toBeTruthy();
  expect(getProperty({ foo: ["bar"] }, "foo[1]", false)).toBeFalsy();

  expect(getProperty([true], "0", false)).toBeFalsy();

  expect(getProperty({ foo: [true] }, "foo.0", false)).toBeFalsy();
  expect(
    getProperty(
      {
        foo: {
          0: true,
        },
      },
      "foo.0"
    )
  ).toBeTruthy();

  expect(
    getProperty(
      [
        {
          "[1]": true,
        },
        false,
        false,
      ],
      "[0].\\[1]"
    )
  ).toBeTruthy();

  expect(getProperty({ foo: { "[0]": true } }, "foo.\\[0]")).toBeTruthy();
  expect(() => getProperty({ foo: { "[0]": true } }, "foo.[0\\]")).toThrowError(
    "Invalid character in an index"
  );
  expect(getProperty({ foo: { "\\": [true] } }, "foo.\\\\[0]")).toBeTruthy();
  expect(() => getProperty({ foo: { "[0]": true } }, "foo.[0\\]")).toThrowError(
    "Invalid character in an index"
  );

  expect(() =>
    getProperty({ "foo[0": { "9]": true } }, "foo[0.9]")
  ).toThrowError("Invalid character in an index");
  expect(() => getProperty({ "foo[-1]": true }, "foo[-1]")).toThrowError(
    "Invalid character in an index"
  );
});

test("setProperty", () => {
  const func = () => "test";
  let fixture1 = {};

  const o1 = setProperty(fixture1, "foo", 2);
  expect(fixture1.foo).toBe(2);
  expect(o1).toBe(fixture1);

  fixture1 = { foo: { bar: 1 } };
  setProperty(fixture1, "foo.bar", 2);
  expect(fixture1.foo.bar).toBe(2);

  setProperty(fixture1, "foo.bar.baz", 3);
  expect(fixture1.foo.bar.baz).toBe(3);

  setProperty(fixture1, "foo.bar", "test");
  expect(fixture1.foo.bar).toBe("test");

  setProperty(fixture1, "foo.bar", null);
  expect(fixture1.foo.bar).toBe(null);

  setProperty(fixture1, "foo.bar", false);
  expect(fixture1.foo.bar).toBe(false);

  setProperty(fixture1, "foo.bar", undefined);
  expect(fixture1.foo.bar).toBe(undefined);

  setProperty(fixture1, "foo.fake.fake2", "fake");
  expect(fixture1.foo.fake.fake2).toBe("fake");

  setProperty(fixture1, "foo.function", func);
  expect(fixture1.foo.function).toBe(func);

  /**
   *
   */
  function fn() {}
  setProperty(fn, "foo.bar", 1);
  expect(fn.foo.bar).toBe(1);

  fixture1.fn = fn;
  setProperty(fixture1, "fn.bar.baz", 2);
  expect(fixture1.fn.bar.baz).toBe(2);

  const fixture2 = { foo: null };
  setProperty(fixture2, "foo.bar", 2);
  expect(fixture2.foo.bar).toBe(2);

  const fixture3 = {};
  setProperty(fixture3, "", 3);
  expect(fixture3[""]).toBe(3);

  setProperty(fixture1, "foo\\.bar.baz", true);
  expect(fixture1["foo.bar"].baz).toBe(true);

  setProperty(fixture1, "fo\\.ob\\.ar.baz", true);
  expect(fixture1["fo.ob.ar"].baz).toBeTruthy();

  const fixture4 = "noobject";
  const output4 = setProperty(fixture4, "foo.bar", 2);
  expect(fixture4).toBe("noobject");
  expect(output4).toBe(fixture4);

  const fixture5 = [];

  setProperty(fixture5, "[1]", true);
  expect(fixture5[1]).toBe(true);

  setProperty(fixture5, "[0].foo[0]", true);
  expect(fixture5[0].foo[0]).toBe(true);

  expect(() => setProperty(fixture5, "1", true)).toThrowError(
    "Cannot use string index"
  );

  expect(() => setProperty(fixture5, "0.foo.0", true)).toThrowError(
    "Cannot use string index"
  );

  const fixture6 = {};

  setProperty(fixture6, "foo[0].bar", true);
  expect(fixture6.foo[0].bar).toBeTruthy();
  expect(fixture6).toMatchObject({
    foo: [
      {
        bar: true,
      },
    ],
  });

  const fixture7 = { foo: ["bar", "baz"] };
  setProperty(fixture7, "foo.length", 1);
  expect(fixture7.foo.length).toBe(1);
  expect(fixture7).toMatchObject({ foo: ["bar"] });
});

test("deleteProperty", () => {
  const func = () => "test";
  func.foo = "bar";

  const inner = {
    a: "a",
    b: "b",
    c: "c",
    func,
  };
  const fixture1 = {
    foo: {
      bar: {
        baz: inner,
      },
    },
    top: {
      dog: "sindre",
    },
  };

  expect(fixture1.foo.bar.baz.c).toBe("c");
  expect(deleteProperty(fixture1, "foo.bar.baz.c")).toBeTruthy();
  expect(fixture1.foo.bar.baz.c).toBe(undefined);

  expect(fixture1.top.dog).toBe("sindre");
  expect(deleteProperty(fixture1, "top")).toBeTruthy();
  expect(fixture1.top).toBe(undefined);

  expect(fixture1.foo.bar.baz.func.foo).toBe("bar");
  expect(deleteProperty(fixture1, "foo.bar.baz.func.foo")).toBeTruthy();
  expect(fixture1.foo.bar.baz.func.foo).toBe(undefined);

  expect(fixture1.foo.bar.baz.func).toBe(func);
  expect(deleteProperty(fixture1, "foo.bar.baz.func")).toBeTruthy();
  expect(fixture1.foo.bar.baz.func).toBe(undefined);

  setProperty(fixture1, "foo\\.bar.baz", true);
  expect(fixture1["foo.bar"].baz).toBeTruthy();
  expect(deleteProperty(fixture1, "foo\\.bar.baz")).toBeTruthy();
  expect(fixture1["foo.bar"].baz).toBe(undefined);

  const fixture2 = {};
  setProperty(fixture2, "foo.bar\\.baz", true);
  expect(fixture2.foo["bar.baz"]).toBeTruthy();
  expect(deleteProperty(fixture2, "foo.bar\\.baz")).toBeTruthy();
  expect(fixture2.foo["bar.baz"]).toBe(undefined);

  fixture2.dotted = {
    sub: {
      "dotted.prop": "foo",
      other: "prop",
    },
  };
  expect(deleteProperty(fixture2, "dotted.sub.dotted\\.prop")).toBeTruthy();
  expect(fixture2.dotted.sub["dotted.prop"]).toBe(undefined);
  expect(fixture2.dotted.sub.other).toBe("prop");

  const fixture3 = { foo: null };
  expect(deleteProperty(fixture3, "foo.bar")).toBeFalsy();
  expect(fixture3).toMatchObject({ foo: null });

  const fixture4 = [
    {
      top: {
        dog: "sindre",
      },
    },
  ];

  expect(() => deleteProperty(fixture4, "0.top.dog")).toThrowError(
    "Cannot use string index"
  );
  expect(deleteProperty(fixture4, "[0].top.dog")).toBeTruthy();
  expect(fixture4).toMatchObject([{ top: {} }]);

  const fixture5 = {
    foo: [
      {
        bar: ["foo", "bar"],
      },
    ],
  };

  deleteProperty(fixture5, "foo[0].bar[0]");

  const fixtureArray = [];
  fixtureArray[1] = "bar";

  expect(fixture5).toMatchObject({
    foo: [
      {
        bar: fixtureArray,
      },
    ],
  });

  const fixture6 = {};

  setProperty(fixture6, "foo.bar.0", "fizz");
});

test("hasProperty", () => {
  const fixture1 = { foo: { bar: 1 } };
  expect(hasProperty(fixture1)).toBeFalsy();
  expect(hasProperty(fixture1, "foo")).toBeTruthy();
  expect(hasProperty({ foo: 1 }, "foo")).toBeTruthy();
  expect(hasProperty({ foo: null }, "foo")).toBeTruthy();
  expect(hasProperty({ foo: undefined }, "foo")).toBeTruthy();
  expect(hasProperty({ foo: { bar: true } }, "foo.bar")).toBeTruthy();
  expect(
    hasProperty({ foo: { bar: { baz: true } } }, "foo.bar.baz")
  ).toBeTruthy();
  expect(
    hasProperty({ foo: { bar: { baz: null } } }, "foo.bar.baz")
  ).toBeTruthy();
  expect(hasProperty({ foo: { bar: "a" } }, "foo.fake.fake2")).toBeFalsy();
  expect(hasProperty({ foo: null }, "foo.bar")).toBeFalsy();
  expect(hasProperty({ foo: "" }, "foo.bar")).toBeFalsy();

  /**
   *
   */
  function fn() {}
  fn.foo = { bar: 1 };
  expect(hasProperty(fn)).toBeFalsy();
  expect(hasProperty(fn, "foo")).toBeTruthy();
  expect(hasProperty(fn, "foo.bar")).toBeTruthy();

  expect(
    hasProperty({ "foo.baz": { bar: true } }, "foo\\.baz.bar")
  ).toBeTruthy();
  expect(
    hasProperty({ "fo.ob.az": { bar: true } }, "fo\\.ob\\.az.bar")
  ).toBeTruthy();
  expect(hasProperty(undefined, "fo\\.ob\\.az.bar")).toBeFalsy();

  expect(
    hasProperty(
      {
        foo: [{ bar: ["bar", "bizz"] }],
      },
      "foo[0].bar.1"
    )
  ).toBeFalsy();
  expect(
    hasProperty(
      {
        foo: [{ bar: ["bar", "bizz"] }],
      },
      "foo[0].bar.2"
    )
  ).toBeFalsy();
  expect(
    hasProperty(
      {
        foo: [{ bar: ["bar", "bizz"] }],
      },
      "foo[1].bar.1"
    )
  ).toBeFalsy();
  expect(
    hasProperty(
      {
        foo: [
          {
            bar: {
              1: "bar",
            },
          },
        ],
      },
      "foo[0].bar.1"
    )
  ).toBeTruthy();
});

test("escapePath", () => {
  expect(escapePath("foo.bar[0]")).toBe("foo\\.bar\\[0]");
  expect(escapePath("foo\\.bar[0]")).toBe("foo\\\\\\.bar\\[0]");
  expect(escapePath("foo\\.bar[0]")).toBe("foo\\\\\\.bar\\[0]"); // eslint-disable-line no-useless-escape
  expect(escapePath("foo\\\\.bar[0]")).toBe("foo\\\\\\\\\\.bar\\[0]");
  expect(escapePath("foo\\\\.bar\\\\[0]")).toBe(
    "foo\\\\\\\\\\.bar\\\\\\\\\\[0]"
  );
  expect(escapePath("foo[0].bar")).toBe("foo\\[0]\\.bar");
  expect(escapePath("foo.bar[0].baz")).toBe("foo\\.bar\\[0]\\.baz");
  expect(escapePath("[0].foo")).toBe("\\[0]\\.foo");
  expect(escapePath("")).toBe("");

  expect(() => {
    escapePath(0);
  }).toThrowError("Expected a string");
});

test("deepKeys", () => {
  const object = {
    "a.b": {
      c: {
        d: [
          1,
          2,
          {
            g: 3,
          },
        ],
        e: "🦄",
        f: 0,
      },
      "": {
        a: 0,
      },
    },
    "": {
      a: 0,
    },
  };
  const keys = deepKeys(object);

  expect(keys).toMatchObject([
    "a\\.b.c.d[0]",
    "a\\.b.c.d[1]",
    "a\\.b.c.d[2].g",
    "a\\.b.c.e",
    "a\\.b.c.f",
    "a\\.b..a",
    ".a",
  ]);

  for (const key of keys) {
    expect(hasProperty(object, key)).toBeTruthy();
  }

  expect(deepKeys([])).toMatchObject([]);
  expect(deepKeys(0)).toMatchObject([]);
});

test("prevent setting/getting `__proto__`", () => {
  setProperty({}, "__proto__.unicorn", "🦄");
  expect({}.unicorn).not.toBe("🦄");

  expect(getProperty({}, "__proto__")).toBe(undefined);
});

test("return default value if path is invalid", () => {
  expect(getProperty({}, "constructor", "🦄")).toBe("🦄");
});

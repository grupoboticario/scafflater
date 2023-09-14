import ScafflaterOptions from "../../options";
import JsonAppender from "./json-appender";

const destJson = `{
  "property": "the property",
  "objectProperty": {
    "prop1": 10
  },
  "arrayProperty": [
    "array item"
  ]
}`;

test("Append Json", async () => {
  // ARRANGE
  const srcJson = `
  // @scf-option { "some": "config" }
  {
    "new-property": "the property",
    "objectProperty": {
      "new-object-prop": 10
    },
    "arrayProperty": [
      "new array item"
    ]
  }`;

  const jsonAppender = new JsonAppender();

  // ACT
  const result = await jsonAppender.append(
    { options: new ScafflaterOptions() },
    srcJson,
    destJson
  );

  // ASSERT
  expect(JSON.parse(result.result)).toStrictEqual(
    JSON.parse(`{
    "property": "the property",
    "new-property": "the property",
    "objectProperty": {
      "prop1": 10,
      "new-object-prop": 10
    },
    "arrayProperty": [
      "array item",
      "new array item"
    ]
  }`)
  );
});

test("Empty Source Json", async () => {
  // ARRANGE
  const srcJson = `
  // @scf-option { "some": "config" }
  // some comment

  {
    "new-property": "the property",
    "objectProperty": {
      "new-object-prop": 10 // some comment
    },
    "arrayProperty": [
      "new array item"
    ]
  }`;

  const jsonAppender = new JsonAppender();

  // ACT
  const result = await jsonAppender.append(
    { options: new ScafflaterOptions() },
    srcJson,
    `// @scf-option { "some": "config" }
// some comment`
  );

  // ASSERT
  expect(JSON.parse(result.result)).toStrictEqual(
    JSON.parse(`{
      "new-property": "the property",
      "objectProperty": {
        "new-object-prop": 10
      },
      "arrayProperty": [
        "new array item"
      ]
    }`)
  );
});

test("Empty Destiny Json", async () => {
  // ARRANGE
  const srcJson = `// @scf-option { "some": "config" }
// some comment`;

  const jsonAppender = new JsonAppender();

  // ACT
  const result = await jsonAppender.append(
    { options: new ScafflaterOptions() },
    srcJson,
    destJson
  );

  // ASSERT
  expect(JSON.parse(result.result)).toStrictEqual(
    JSON.parse(`{
    "property": "the property",
    "objectProperty": {
      "prop1": 10
    },
    "arrayProperty": [
      "array item"
    ]
  }`)
  );
});

test("Strip comments", async () => {
  // ARRANGE
  const srcJson = `// @scf-option { "some": "config" }
/*
  some comment
*/
{
  "http-sample": "http://some.url"
}
`;

  const jsonAppender = new JsonAppender();

  // ACT
  const result = await jsonAppender.append(
    { options: new ScafflaterOptions() },
    srcJson,
    destJson
  );

  // ASSERT
  expect(JSON.parse(result.result)).toStrictEqual(
    JSON.parse(`{
    "property": "the property",
    "http-sample": "http://some.url",
    "objectProperty": {
      "prop1": 10
    },
    "arrayProperty": [
      "array item"
    ]
  }`)
  );
});

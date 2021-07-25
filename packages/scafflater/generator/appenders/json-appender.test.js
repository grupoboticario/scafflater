const ScafflaterOptions = require("../../options");
const JsonAppender = require("./json-appender");

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

const JsonAppender = require('./json-appender')

const destJson = `{
  "property": "the property",
  "objectProperty": {
    "prop1": 10
  },
  "arrayProperty": [
    "array item"
  ]
}`

test('Append Json', () =>{
  // ARRANGE
  const srcJson = `{
    "new-property": "the property",
    "objectProperty": {
      "new-object-prop": 10
    },
    "arrayProperty": [
      "new array item"
    ]
  }`

  const jsonAppender = new JsonAppender()

  // ACT
  const result = jsonAppender.append({}, srcJson, destJson)

  // ASSERT
  expect(JSON.parse(result.result)).toStrictEqual(JSON.parse(`{
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
  }`))
})

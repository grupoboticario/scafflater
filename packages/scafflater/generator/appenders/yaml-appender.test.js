const YamlAppender = require("./yaml-appender");

const destYaml = `apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: domains-and-systems
spec:
  type: url
  targets:
    - array
    `;

test("Append simple property", async () => {
  // ARRANGE
  const srcYaml = `
test-prop: testing
metadata:
  some-child-prop: this is a child property`;

  const yamlAppender = new YamlAppender();

  // ACT
  const result = await yamlAppender.append({}, srcYaml, destYaml);

  // ASSERT
  expect(result.result).toBe(`apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: domains-and-systems
  some-child-prop: this is a child property
spec:
  type: url
  targets:
    - array
test-prop: testing
`);
});

test("Append array item", async () => {
  // ARRANGE
  const srcYaml = `
spec:
  targets:
  - new array item`;

  const yamlAppender = new YamlAppender();

  // ACT
  const result = await yamlAppender.append({}, srcYaml, destYaml);

  // ASSERT
  expect(result.result).toBe(`apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: domains-and-systems
spec:
  type: url
  targets:
    - array
    - new array item
`);
});

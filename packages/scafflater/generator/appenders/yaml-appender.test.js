const YamlAppender = require("./yaml-appender");
const yaml = require("js-yaml");
const { ScafflaterOptions } = require("../../options");

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
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destYaml
  );

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
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destYaml
  );

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

test("Catalog info merge", async () => {
  // ARRANGE
  const destinYaml = `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: >-
    flask-2
  description: >-
    aeeeeeee
  tags: ["api", "python", "flask"]
  annotations:
    github.com/project-slug: 'gbsandbox/sandb-pdd-flask-2'
    github.com/team-slug: 'gbsandbox/pdd-team'
    argocd/app-selector: 'app=flask-2'
spec:
  type: service
  lifecycle: experimental
  owner: >-
    pdd-team
  system: >-
    pdd
  providesApis:
    - >-
      flask-2`;

  const srcYaml = `
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: >-
    flask-2
  description: >-
    aeeeeeee
  tags: [api, python, flask]
  annotations:
    github.com/project-slug: "gbsandbox/sandb-pdd-flask-2"
    github.com/team-slug: "gbsandbox/pdd-team"
    argocd/app-selector: "app=flask-2"
spec:
  type: service
  lifecycle: experimental
  owner: >-
    pdd-team
  system: >-
    pdd`;

  const yamlAppender = new YamlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destinYaml
  );

  // ASSERT
  expect(yaml.load(result.result)).toStrictEqual(
    yaml.load(`apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: flask-2
  description: aeeeeeee
  tags: 
    - api
    - python
    - flask
  annotations:
    github.com/project-slug: gbsandbox/sandb-pdd-flask-2
    github.com/team-slug: gbsandbox/pdd-team
    argocd/app-selector: app=flask-2
spec:
  type: service
  lifecycle: experimental
  owner: pdd-team
  system: pdd
  providesApis:
    - flask-2`)
  );
});

test("Destiny Empty text", async () => {
  // ARRANGE
  const destinYaml = `
  # @scf-option { "appenders": ["./appenders/yaml-appender"] }
  # some comment`;

  const srcYaml = `
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: >-
    flask-2
  description: >-
    aeeeeeee
  tags: [api, python, flask]
  annotations:
    github.com/project-slug: "gbsandbox/sandb-pdd-flask-2"
    github.com/team-slug: "gbsandbox/pdd-team"
    argocd/app-selector: "app=flask-2"
spec:
  type: service
  lifecycle: experimental
  owner: >-
    pdd-team
  system: >-
    pdd`;

  const yamlAppender = new YamlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destinYaml
  );

  // ASSERT
  expect(yaml.load(result.result)).toStrictEqual(
    yaml.load(`apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: flask-2
  description: aeeeeeee
  tags: 
    - api
    - python
    - flask
  annotations:
    github.com/project-slug: gbsandbox/sandb-pdd-flask-2
    github.com/team-slug: gbsandbox/pdd-team
    argocd/app-selector: app=flask-2
spec:
  type: service
  lifecycle: experimental
  owner: pdd-team
  system: pdd`)
  );
});

test("Source Empty text", async () => {
  // ARRANGE
  const srcYaml = `
  # @scf-option { "appenders": ["./appenders/yaml-appender"] }
  # some comment
  `;

  const destinyYaml = `
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: >-
    flask-2
  description: >-
    aeeeeeee
  tags: [api, python, flask]
  annotations:
    github.com/project-slug: "gbsandbox/sandb-pdd-flask-2"
    github.com/team-slug: "gbsandbox/pdd-team"
    argocd/app-selector: "app=flask-2"
spec:
  type: service
  lifecycle: experimental
  owner: >-
    pdd-team
  system: >-
    pdd`;

  const yamlAppender = new YamlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destinyYaml
  );

  // ASSERT
  expect(yaml.load(result.result)).toStrictEqual(
    yaml.load(`apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: flask-2
  description: aeeeeeee
  tags: 
    - api
    - python
    - flask
  annotations:
    github.com/project-slug: gbsandbox/sandb-pdd-flask-2
    github.com/team-slug: gbsandbox/pdd-team
    argocd/app-selector: app=flask-2
spec:
  type: service
  lifecycle: experimental
  owner: pdd-team
  system: pdd`)
  );
});

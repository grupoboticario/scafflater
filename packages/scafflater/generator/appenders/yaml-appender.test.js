import YamlAppender from "./yaml-appender";
import YAML from "yaml";
import ScafflaterOptions from "../../options";

const destYaml = `apiVersion: backstage.io/v1alpha1
# doc comment
kind: Location
metadata:
  # metadata original
  name: domains-and-systems
spec:
  # spec body
  type: url # an url
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
    destYaml,
  );

  // ASSERT
  expect(YAML.parse(result.result)).toStrictEqual(
    YAML.parse(`apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: domains-and-systems
  some-child-prop: this is a child property
spec:
  type: url
  targets:
    - array
test-prop: testing
`),
  );
});

test("Append with comments", async () => {
  // ARRANGE
  const srcYaml = `
test-prop: testing
metadata:
  #some-comment
  some-child-prop: this is a child property
  property-with-comment: #{KEDA_VALUE}`;

  const yamlAppender = new YamlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destYaml,
  );

  // ASSERT
  expect(result.result).toContain("# an url");
  expect(result.result).toContain("#some-comment");
  expect(result.result).toContain("# metadata original");
  expect(result.result).toContain("#{KEDA_VALUE}");
  expect(result.result).toContain("# spec body");
  expect(result.result).toContain("# doc comment");
  expect(YAML.parse(result.result)).toStrictEqual(
    YAML.parse(`apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  #some-comment
  name: domains-and-systems
  some-child-prop: this is a child property
  property-with-comment: #{KEDA_VALUE}
spec:
  type: url
  targets:
    - array
test-prop: testing
`),
  );
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
    destYaml,
  );

  // ASSERT
  expect(YAML.parse(result.result)).toStrictEqual(
    YAML.parse(`apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: domains-and-systems
spec:
  type: url
  targets:
    - array
    - new array item
`),
  );
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
    destinYaml,
  );

  // ASSERT
  expect(YAML.parse(result.result)).toStrictEqual(
    YAML.parse(`apiVersion: backstage.io/v1alpha1
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
    - flask-2`),
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
    destinYaml,
  );

  // ASSERT
  expect(YAML.parse(result.result)).toStrictEqual(
    YAML.parse(`apiVersion: backstage.io/v1alpha1
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
  system: pdd`),
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
    destinyYaml,
  );

  // ASSERT
  expect(YAML.parse(result.result)).toStrictEqual(
    YAML.parse(`apiVersion: backstage.io/v1alpha1
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
  system: pdd`),
  );
});

test("Merge complex arrays", async () => {
  // ARRANGE
  const srcYaml = `
app:
  env:
    - name: NEW_RELIC_ENV
      value: dev
    - name: NEW_RELIC_CONFIG_FILE
      value: ./newrelic.ini
    - name: PYTHONPATH
      value: .
    - name: PYTHONUNBUFFERED
      value: '1'
    - name: PYTHONDONTWRITEBYTECODE
      value: '1'
    - name: POETRY_VIRTUALENVS_CREATE
      value: 'false'
    - name: LOG_LEVEL_ENABLED
      value: ERROR
  `;

  const destinyYaml = `
app:
  env:
    - name: DOCKER_CMD
      value: sudo execute
    - name: LOG_LEVEL_ENABLED
      value: DEBUG`;

  const yamlAppender = new YamlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions({ arrayAppendStrategy: "key(name)" }) },
    srcYaml,
    destinyYaml,
  );

  // ASSERT
  expect(YAML.parse(result.result)).toStrictEqual(
    YAML.parse(`app:
    env:
      - name: DOCKER_CMD
        value: sudo execute
      - name: LOG_LEVEL_ENABLED
        value: DEBUG
      - name: NEW_RELIC_ENV
        value: dev
      - name: NEW_RELIC_CONFIG_FILE
        value: ./newrelic.ini
      - name: PYTHONPATH
        value: .
      - name: PYTHONUNBUFFERED
        value: '1'
      - name: PYTHONDONTWRITEBYTECODE
        value: '1'
      - name: POETRY_VIRTUALENVS_CREATE
        value: 'false'`),
  );
});

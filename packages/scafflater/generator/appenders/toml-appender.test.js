import TomlAppender from "./toml-appender";
import ScafflaterOptions from "../../options";

const destYaml = `
title = 'TOML Example'

[owner]
name = 'Tom Preston-Werner'
dob = 1979-05-27T07:32:00-08:00
number = 10
bigint = 9007199254740991
boolean = true

[database]
enabled = true
ports = [ 8000, 8001, 8002 ]
data = [ ['delta', 'phi'], [3.14] ]
temp_targets = { cpu = 79.5, case = 72.0 }

[servers]

[servers.alpha]
ip = '10.0.0.1'
role = 'frontend'

[servers.beta]
ip = '10.0.0.2'
role = 'backend'

[tool.black]
line-length = 79
target-version = ['py37']
include = '\\.pyi?$'
exclude = '''
(
  /(
      \\.eggs         # exclude a few common directories in the
    | \\.git          # root of the project
    | \\.hg
    | \\.mypy_cache
    | \\.tox
    | \\.venv
    | _build
    | buck-out
    | build
    | dist
    | migrations
  )
)
'''
`;

test("Append simple property", async () => {
  // ARRANGE
  const srcYaml = `
[owner]
name = 'Other'
number = 11
bigint = 9007199254740992
boolean = false
`;

  const yamlAppender = new TomlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destYaml
  );

  // ASSERT
  expect(result.result).toBe(`
title = 'TOML Example'

[owner]
name = 'Other'
dob = 1979-05-27T07:32:00-08:00
number = 11
bigint = 9007199254740992
boolean = false

[database]
enabled = true
ports = [ 8000, 8001, 8002 ]
data = [ [ 'delta', 'phi' ], [ 3.14 ] ]
temp_targets = { cpu = 79.5, case = 72.0 }

[servers]

[servers.alpha]
ip = '10.0.0.1'
role = 'frontend'

[servers.beta]
ip = '10.0.0.2'
role = 'backend'

[tool.black]
line-length = 79
target-version = [ 'py37' ]
include = '\\.pyi?$'
exclude = '''
(
  /(
      \\.eggs         # exclude a few common directories in the
    | \\.git          # root of the project
    | \\.hg
    | \\.mypy_cache
    | \\.tox
    | \\.venv
    | _build
    | buck-out
    | build
    | dist
    | migrations
  )
)
'''
`);
});

test("Empty Source Toml", async () => {
  // ARRANGE
  const yamlAppender = new TomlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    `# @scf-option { "appenders": ["./appenders/toml-appender"] }
# some comment`,
    destYaml
  );

  // ASSERT
  expect(result.result).toBe(`
title = 'TOML Example'

[owner]
name = 'Tom Preston-Werner'
dob = 1979-05-27T07:32:00-08:00
number = 10
bigint = 9007199254740991
boolean = true

[database]
enabled = true
ports = [ 8000, 8001, 8002 ]
data = [ [ 'delta', 'phi' ], [ 3.14 ] ]
temp_targets = { cpu = 79.5, case = 72.0 }

[servers]

[servers.alpha]
ip = '10.0.0.1'
role = 'frontend'

[servers.beta]
ip = '10.0.0.2'
role = 'backend'

[tool.black]
line-length = 79
target-version = [ 'py37' ]
include = '\\.pyi?$'
exclude = '''
(
  /(
      \\.eggs         # exclude a few common directories in the
    | \\.git          # root of the project
    | \\.hg
    | \\.mypy_cache
    | \\.tox
    | \\.venv
    | _build
    | buck-out
    | build
    | dist
    | migrations
  )
)
'''
`);
});

test("Empty Destiny Toml", async () => {
  // ARRANGE
  const srcYaml = `
[owner]
name = 'Other'`;

  const yamlAppender = new TomlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    `# @scf-option { "appenders": ["./appenders/toml-appender"] }
# some comment`
  );

  // ASSERT
  expect(result.result).toBe(`
[owner]
name = 'Other'
`);
});

test("Append array item", async () => {
  // ARRANGE
  const srcYaml = `
[database]

ports = [ 8003 ]

[tool.black]
target-version = [ 'py38' ]`;

  const yamlAppender = new TomlAppender();

  // ACT
  const result = await yamlAppender.append(
    { options: new ScafflaterOptions() },
    srcYaml,
    destYaml
  );

  // ASSERT
  expect(result.result).toBe(`
title = 'TOML Example'

[owner]
name = 'Tom Preston-Werner'
dob = 1979-05-27T07:32:00-08:00
number = 10
bigint = 9007199254740991
boolean = true

[database]
enabled = true
ports = [
	8000,
	8001,
	8002,
	8003,
]
data = [ [ 'delta', 'phi' ], [ 3.14 ] ]
temp_targets = { cpu = 79.5, case = 72.0 }

[servers]

[servers.alpha]
ip = '10.0.0.1'
role = 'frontend'

[servers.beta]
ip = '10.0.0.2'
role = 'backend'

[tool.black]
line-length = 79
target-version = [
	'py37',
	'py38',
]
include = '\\.pyi?$'
exclude = '''
(
  /(
      \\.eggs         # exclude a few common directories in the
    | \\.git          # root of the project
    | \\.hg
    | \\.mypy_cache
    | \\.tox
    | \\.venv
    | _build
    | buck-out
    | build
    | dist
    | migrations
  )
)
'''
`);
});

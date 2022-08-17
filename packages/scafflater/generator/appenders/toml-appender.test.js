const TomlAppender = require("./toml-appender");
const { ScafflaterOptions } = require("../../options");

const destYaml = `
title = 'TOML Example'

[owner]
name = 'Tom Preston-Werner'
dob = 1979-05-27T07:32:00-08:00

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
role = 'backend'`;

test("Append simple property", async () => {
  // ARRANGE
  const srcYaml = `
[owner]
name = "Other"`;

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
`);
});

test("Append array item", async () => {
  // ARRANGE
  const srcYaml = `
[database]

ports = [ 8003 ]`;

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

[database]
enabled = true
ports = [
	8000,
	8001,
	8002,
	8003,
]
data = [ ['delta', 'phi'], [3.14] ]
temp_targets = { cpu = 79.5, case = 72.0 }

[servers]

[servers.alpha]
ip = '10.0.0.1'
role = 'frontend'

[servers.beta]
ip = '10.0.0.2'
role = 'backend'
`);
});

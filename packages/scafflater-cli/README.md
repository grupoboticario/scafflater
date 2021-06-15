scf-cli
=======

The Scafflater Cli

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/scf-cli.svg)](https://npmjs.org/package/scf-cli)
[![Downloads/week](https://img.shields.io/npm/dw/scf-cli.svg)](https://npmjs.org/package/scf-cli)
[![License](https://img.shields.io/npm/l/scf-cli.svg)](https://github.com/chicoribas/scf-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g scafflater-cli
$ scf-cli COMMAND
running command...
$ scf-cli (-v|--version|version)
scafflater-cli/0.0.1 darwin-x64 node-v15.7.0
$ scf-cli --help [COMMAND]
USAGE
  $ scf-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`scf-cli add`](#scf-cli-add)
* [`scf-cli help [COMMAND]`](#scf-cli-help-command)
* [`scf-cli init [GIT_HUB_REPOSITORY]`](#scf-cli-init-git_hub_repository)

## `scf-cli add`

Adds a template partial in a output folder

```
USAGE
  $ scf-cli add

OPTIONS
  -n, --partialName=partialName  The partial name
  -o, --output=output            [default: ./] The output folder
  -p, --parameters=parameters    [default: ] The parameters to init template

DESCRIPTION
  ...
```

_See code: [commands/add.js](https://github.com/chicoribas/scafflater/blob/v0.0.1/commands/add.js)_

## `scf-cli help [COMMAND]`

display help for scf-cli

```
USAGE
  $ scf-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `scf-cli init [GIT_HUB_REPOSITORY]`

Initializes the template in a output folder

```
USAGE
  $ scf-cli init [GIT_HUB_REPOSITORY]

OPTIONS
  -o, --output=output          [default: ./] The output folder
  -p, --parameters=parameters  [default: ] The parameters to init template

DESCRIPTION
  ...
```

_See code: [commands/init.js](https://github.com/chicoribas/scafflater/blob/v0.0.1/commands/init.js)_
<!-- commandsstop -->

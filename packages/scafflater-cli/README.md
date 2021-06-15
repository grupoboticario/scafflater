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
$ scafflater-cli COMMAND
running command...
$ scafflater-cli (-v|--version|version)
scafflater-cli/0.0.4 darwin-x64 node-v15.7.0
$ scafflater-cli --help [COMMAND]
USAGE
  $ scafflater-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`scafflater-cli add`](#scafflater-cli-add)
* [`scafflater-cli help [COMMAND]`](#scafflater-cli-help-command)
* [`scafflater-cli init [GIT_HUB_REPOSITORY]`](#scafflater-cli-init-git_hub_repository)

## `scafflater-cli add`

Adds a template partial in a output folder

```
USAGE
  $ scafflater-cli add

OPTIONS
  -n, --partialName=partialName  The partial name
  -o, --output=output            [default: ./] The output folder
  -p, --parameters=parameters    [default: ] The parameters to init template

DESCRIPTION
  ...
```

_See code: [commands/add.js](https://github.com/chicoribas/scafflater/blob/v0.0.4/commands/add.js)_

## `scafflater-cli help [COMMAND]`

display help for scafflater-cli

```
USAGE
  $ scafflater-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `scafflater-cli init [GIT_HUB_REPOSITORY]`

Initializes the template in a output folder

```
USAGE
  $ scafflater-cli init [GIT_HUB_REPOSITORY]

OPTIONS
  -o, --output=output          [default: ./] The output folder
  -p, --parameters=parameters  [default: ] The parameters to init template

DESCRIPTION
  ...
```

_See code: [commands/init.js](https://github.com/chicoribas/scafflater/blob/v0.0.4/commands/init.js)_
<!-- commandsstop -->

Scafflater Cli
=======

[![Scafflater Cli](https://img.shields.io/badge/dynamic/json?color=green&label=scafflater-cli&query=%24.collected.metadata.version&url=https%3A%2F%2Fapi.npms.io%2Fv2%2Fpackage%2Fscafflater-cli)](https://npmjs.org/package/scafflater-cli)
[![Downloads/week](https://img.shields.io/npm/dw/scafflater-cli.svg)](https://npmjs.org/package/scafflater-cli)
[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![License](https://img.shields.io/npm/l/scafflater-cli.svg)](https://github.com/chicoribas/scafflater-cli/blob/main/package.json)

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
scafflater-cli/0.0.79 darwin-x64 node-v14.17.1
$ scafflater-cli --help [COMMAND]
USAGE
  $ scafflater-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`scafflater-cli help [COMMAND]`](#scafflater-cli-help-command)
* [`scafflater-cli init [SOURCE]`](#scafflater-cli-init-source)
* [`scafflater-cli partial:list`](#scafflater-cli-partiallist)
* [`scafflater-cli partial:run [PARTIAL_NAME]`](#scafflater-cli-partialrun-partial_name)

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `scafflater-cli init [SOURCE]`

Initializes the template in a output folder

```
USAGE
  $ scafflater-cli init [SOURCE]

OPTIONS
  -c, --cache=homeDir|tempDir                                      [default: homeDir] The cache strategy
  -o, --output=output                                              [default: ./] The output folder
  -p, --parameters=parameters                                      [default: ] The parameters to init template

  -s, --templateSource=git|githubClient|isomorphicGit|localFolder  [default: git] Template source indicating how the
                                                                   template is fetched

DESCRIPTION
  ...
```

_See code: [commands/init.js](https://github.com/chicoribas/scafflater/blob/v0.0.79/commands/init.js)_

## `scafflater-cli partial:list`

Lists available partials in template

```
USAGE
  $ scafflater-cli partial:list

OPTIONS
  -c, --cache=homeDir|tempDir  [default: homeDir] The cache strategy
  -o, --output=output          [default: ./] The output folder

DESCRIPTION
  ...
```

_See code: [commands/partial/list.js](https://github.com/chicoribas/scafflater/blob/v0.0.79/commands/partial/list.js)_

## `scafflater-cli partial:run [PARTIAL_NAME]`

Runs a partial and append the result to the output folder

```
USAGE
  $ scafflater-cli partial:run [PARTIAL_NAME]

ARGUMENTS
  PARTIAL_NAME  The partial name

OPTIONS
  -c, --cache=homeDir|tempDir  [default: homeDir] The cache strategy
  -o, --output=output          [default: ./] The output folder
  -p, --parameters=parameters  [default: ] The parameters to init template
  -t, --template=template      The template which contains the partial to be run

DESCRIPTION
  ...
```

_See code: [commands/partial/run.js](https://github.com/chicoribas/scafflater/blob/v0.0.79/commands/partial/run.js)_
<!-- commandsstop -->

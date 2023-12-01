Options can control and customize how Scafflater generate the output. It can be defined on:

- [Available Options](#available-options)
  - [Appenders](#appenders)
  - [Append Strategies](#append-strategies)
  - [Array Append Strategies](#array-append-strategies)
- [Defining Options](#defining-options)
  - [Scafflater Npm Package](#scafflater-npm-package)
  - [Template](#template)
  - [File or Region Content](#file-or-region-content)
  - [Scafflater Cli Option](#scafflater-cli-option)

The order listed above is considered for overrides too. This means that the value for an option defined on Scafflater Npm Package will be overridden by the value defined on Region content.

## Available Options

| Option                | Description                                                                                                                                                                                                                                                           | Default   | Handlebars | Availability                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- | -------------------------------------------- |
| `appenders`           | Appender to be used to append the new content on target. See [Appenders](#appenders) for details                                                                                                                                                                      | `true`    | N          | files                                        |
| `appendStrategy`      | Strategy to append new texts on existing content. See [Append Strategies](#append-strategies) for details                                                                                                                                                             | `true`    | N          | files                                        |
| `arrayAppendStrategy` | Array Append Strategy. Available for yaml, json and toml appenders . See [Array Append Strategies](#array-append-strategies) for details                                                                                                                              | `combine` | N          | files                                        |
| `targetName`          | Defines the name of generated file or folder. Glob patters can be set and can be used to append content on multiples targets. To use glob, the format needs to be `glob<pattern>`. For example `glob<**.*.js>` can be used to append results on all javascript files. To create multiple files, you can use `each<folder/file1.txt,folder/file2.txt>` to create two files: ont on `folder/file1.txt` and other on `folder/file1.txt` location. | -         | Y          | templates, partials, context, files, regions |
| `ignore`              | If boolean, indicates if a file or folder must be ignored. If array of strings, indicates patterns (same patterns of gitignore) to ignore.                                                                                                                            | `false`   | Y          | templates, partials, context, files, regions |
| `mode`                | Mode to run scafflater. Util for debug files generations. Available options: `prod` or `debug`                                                                                                                                                                        | `prod`    | N          | files                                        |
| `logger`              | Winston logger instance.                                                                                                                                                                                                                                              | -         | -          | Scafflater Npm package constructor           |
| `logRun`              | Defines if a log run must be created for initialization or partial run. The log is saved on scafflater folder                                                                                                                                                         | `true`    | N          | templates, partials, context, files, regions |

#### Appenders

By default, the file content and regions are used to append generated content.

For structured content, there are special appenders to be used on these files:

- `json-appender`
- `yaml-appender`
- `toml-appender`

You can use an extension method on this option to

Sample:

```json
// @scf-option { "appenders": ["json-appender"] }
{
  "name": "json-sample",
  "age": 15
}
```

#### Append Strategies

Available append strategies:

- `append`: The content will be appended to the destination (Default)
- `appendIfExists`: The content will be appended only if destination already exists
- `replace`: The content will replace the target content
- `ignore`: If the destination exists and is not empty, will ignore the generated code.

#### Array Append Strategies

Defines how a source array should be merged on target array:

- `combine`: The array will be combine item per item (Default)
- `concat`: The arrays will be concatenated
- `replace`: The source array will replace the target array
- `ignore`: If the destination exists and is not empty, will ignore the source array.
- `key<keyName>`: the parameter 'keyName' will be used as item key to merge arrays. The object of source will replace the object with the same key value on target.

## Defining Options

### Scafflater Npm Package

Scafflater constructor receives an object with the options for scafflater:

```javascript
const options = {
  source: "git",
};

const scafflater = new Scafflater(config);

await scafflater.init("template", parameters);
```

### Template

Templates can define options to be used as default. Those parameters are defined on `scafflater.json` file with the template definition:

```json
{
  "name": "sample-template",
  "options": {
    "extensionFolderName": "exts"
  }
}
```

### File or Region Content

Scafflater will look for the pattern `@scf-option <json-notation>` to detect options defined for that specific file or region. The lines with this pattern will be stripped from the final result.

Sample to set the target name of a javascript file:

```javascript
// @scf-option { "targetName": "new-file-name.js" }

function log(msg) {
  console.log(msg);
}

module.exports = log;
```

Sample to change the append strategy for an specific file region:

```javascript
function log(msg) {
  // @scf-region function-content
  // @scf-option { "appendStrategy": "replace" }
  console.log(msg);
  // @end-scf-region
}

module.exports = log;
```

### Scafflater Cli Option

Scafflater cli receives `-o`, `--options=options` on init or run partial to define optiona

```bash
scafflater-cli init /template/source -o=mode:debug
```

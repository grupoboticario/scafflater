const fs = require("fs-extra");
const { Config } = require("./config");
const glob = require("glob");
const { TemplateConfig } = require("./template-config");
const { PartialConfig } = require("./partial-config");
const { PersistedParameter } = require("./persisted-parameter");
const RanTemplate = require("./ran-template");
const { Source } = require("./source");
const { LocalTemplate } = require("./local-template");
const { ParameterConfig } = require("./parameter-config");

jest.mock("fs-extra");
jest.mock("glob");

describe("ConfigLoader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  const mockedConfig = `{
    "template": {
      "name": "some-type"
    },
    "templates": [
      {
        "name": "ran-template",
        "version": "0.0.1",
        "parameters": {
          "name": "lllll",
          "description": "pppppp"
        },
        "partials": [
          {
            "name": "some-partial"
          }
        ]
      }
    ]
  }`;

  test("isInitialized: test check if is initialized logic", async () => {
    // ARRANGE
    fs.pathExists.mockResolvedValueOnce(true);
    fs.lstat.mockResolvedValueOnce({
      isDirectory: () => {
        return false;
      },
    });
    fs.pathExists.mockResolvedValueOnce(true);
    fs.readFile.mockResolvedValueOnce(mockedConfig);

    // ACT
    const obj = await Config.fromLocalPath("/some/valid/path/.scafflater");

    // ASSERT
    expect(obj.config.isInitialized("ran-template")).toBeTruthy();
    expect(obj.config.isInitialized("not-ran-template")).toBeFalsy();
  });

  describe("save", () => {
    test("Received a file as local path. Save .scafflater file", async () => {
      // ARRANGE
      const config = new Config(new TemplateConfig("some-template", "0.0.1"));
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return false;
        },
      });
      const expected = JSON.stringify(
        {
          template: {
            name: "some-template",
            version: "0.0.1",
          },
        },
        null,
        2
      );

      // ACT
      await config.save("/to/some/path/.scafflater");

      // ASSERT
      expect(fs.writeFile).toHaveBeenCalledWith(
        "/to/some/path/.scafflater",
        expected
      );
    });
  });

  describe("fromLocalPath", () => {
    test("fromLocalPath: the path is invalid, should throw", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValue(false);

      // ACT & ASSERT
      await expect(
        Config.fromLocalPath("/some/invalid/path")
      ).rejects.toThrowError("'/some/invalid/path': the path does not exist.");
    });

    test("fromLocalPath: the path is folder and the .scafflater file does not exist, should return null", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValueOnce(true);
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return true;
        },
      });
      fs.pathExists.mockResolvedValueOnce(false);
      // ACT
      const obj = await Config.fromLocalPath("/some/valid/path/.scafflater");

      // ASSERT
      expect(obj).toBeNull();
    });

    test("fromLocalPath: the path is file but the .scafflater file does not exist, should throw", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValueOnce(true);
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return false;
        },
      });
      fs.pathExists.mockResolvedValueOnce(false);

      // ACT
      const obj = await Config.fromLocalPath("/some/valid/path/.scafflater");

      // ASSERT
      expect(obj).toBeNull();
    });

    test("fromLocalPath: the path is file, the file exists bus does not have a valid json content, should return object", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValueOnce(true);
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return false;
        },
      });
      fs.pathExists.mockResolvedValueOnce(true);
      fs.readFile.mockResolvedValueOnce("this is an invalid json");

      // ACT & ASSERT
      await expect(
        Config.fromLocalPath("/some/valid/path/.scafflater")
      ).rejects.toThrowError(
        "'/some/valid/path/.scafflater': failed to load. Could not load as Json."
      );
    });

    test("fromLocalPath: the path is file, file exists and has an valid json, should return object", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValueOnce(true);
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return false;
        },
      });
      fs.pathExists.mockResolvedValueOnce(true);
      fs.readFile.mockResolvedValueOnce(
        `{
          "globalParameters":[{
            "name": "global-var",
            "value": "global-var-value"
          }],
          "template": {
            "name": "some-type"
          },
          "templates": [
            {
              "name": "ran-template",
              "version": "0.0.1",
              "parameters": {
                "name": "lllll",
                "description": "pppppp"
              },
              "partials": [
                {
                  "name": "some-partial"
                }
              ]
            }
          ]
        }`
      );

      // ACT
      const obj = await Config.fromLocalPath("/some/valid/path/.scafflater");

      // ASSERT
      expect(obj.folderPath).toBe("/some/valid/path");
      expect(obj.filePath).toBe("/some/valid/path/.scafflater");
      expect(obj.config).toBeInstanceOf(Config);
      expect(obj.config.template).toBeInstanceOf(TemplateConfig);
      expect(obj.config.template.name).toBe("some-type");
    });
  });

  describe("scanLocalPath", () => {
    test("The path is invalid, should throw", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValue(false);

      // ACT & ASSERT
      await expect(
        Config.scanLocalPath("/some/invalid/path")
      ).rejects.toThrowError("'/some/invalid/path': the path does not exist.");
    });

    test("fromLocalPath: the path is file, should look for files in the parent folder", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValueOnce(true);
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return false;
        },
      });
      fs.pathExists.mockResolvedValueOnce(false);
      glob.mockImplementation((_pattern, _options, callback) => {
        callback(null, []);
      });

      await Config.scanLocalPath("/some/valid/path/.scafflater");

      // ACT & ASSERT
      expect(glob).toHaveBeenCalledWith(
        `/**/scafflater.jsonc`,
        { root: "/some/valid/path", dot: true },
        expect.anything()
      );
    });

    test("fromLocalPath: the path is folder, should look for files in this folder", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValueOnce(true);
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return true;
        },
      });
      fs.pathExists.mockResolvedValueOnce(false);
      glob.mockImplementation((_pattern, _options, callback) => {
        callback(null, []);
      });

      await Config.scanLocalPath("/some/valid/path");

      // ACT & ASSERT
      expect(glob).toHaveBeenCalledWith(
        `/**/scafflater.jsonc`,
        { root: "/some/valid/path", dot: true },
        expect.anything()
      );
    });

    test("fromLocalPath: load all scafflater config", async () => {
      // ARRANGE
      fs.pathExists.mockResolvedValue(true);
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return true;
        },
      });
      fs.lstat.mockResolvedValue({
        isDirectory: () => {
          return false;
        },
      });
      glob.mockImplementation((_pattern, _options, callback) => {
        callback(null, [
          "/some/path/.scafflater",
          "/some/path/inside/path/.scafflater",
        ]);
      });
      fs.readFile.mockImplementation((file) => {
        if (file === "/some/path/.scafflater") {
          return '{ "template": { "name": "template-name", "version": "0.0.1" } }';
        }
        if (file === "/some/path/inside/path/.scafflater") {
          return '{ "partial": { "name": "partial-name" } }';
        }
        return "The test must not get here";
      });

      const configs = await Config.scanLocalPath("/some/valid/path");

      // ACT & ASSERT
      expect(configs.length).toBe(2);
      expect(configs[0].folderPath).toBe("/some/path");
      expect(configs[0].filePath).toBe("/some/path/.scafflater");
      expect(configs[0].config).toStrictEqual(
        new Config(new TemplateConfig("template-name", "0.0.1"))
      );
      expect(configs[1].folderPath).toBe("/some/path/inside/path");
      expect(configs[1].filePath).toBe("/some/path/inside/path/.scafflater");
      expect(configs[1].config).toStrictEqual(
        new Config(null, new PartialConfig("partial-name"))
      );
    });
  });

  describe("getPersistedParameters", () => {
    test("getPersistedParameters with global and no templateName", () => {
      // ARRANGE
      const config = new Config(
        new TemplateConfig("template", "1"),
        null,
        null,
        null,
        [new PersistedParameter("global1", "the global parameter")]
      );
      const parameters = {
        param1: 123,
      };

      // ACT
      const result = config.getPersistedParameters(parameters);

      // ASSERT
      expect(result).toStrictEqual({
        global1: "the global parameter",
        param1: 123,
      });
    });

    test("getPersistedParameters with global and templateName with parameters", () => {
      // ARRANGE
      const config = new Config(
        new TemplateConfig("template", "1"),
        null,
        [
          new RanTemplate(
            "the-template",
            "1",
            new Source("some-source", "key"),
            [],
            [],
            [new PersistedParameter("template1", "the template parameter")]
          ),
        ],
        null,
        [new PersistedParameter("global1", "the global parameter")]
      );
      const parameters = {
        param1: 123,
      };

      // ACT
      const result = config.getPersistedParameters(parameters, "the-template");

      // ASSERT
      expect(result).toStrictEqual({
        global1: "the global parameter",
        param1: 123,
        template1: "the template parameter",
      });
    });
  });

  describe("setPersistedParameters", () => {
    test("setPersistedParameters with global and template parameters, without partialNa", () => {
      // ARRANGE
      const config = new Config(null, null, [
        new RanTemplate("the-template", "1"),
      ]);
      const localTemplate = new LocalTemplate(
        "",
        "",
        "the-template",
        "",
        "1",
        [],
        {},
        [
          new ParameterConfig("template-param", "template"),
          new ParameterConfig("global-param", "global"),
        ]
      );
      const parameters = {
        "template-param": "the-template-value",
        "global-param": "the-global-value",
      };

      // ACT
      config.setPersistedParameters(localTemplate, parameters);

      // ASSERT
      expect(config.globalParameters).toStrictEqual([
        new PersistedParameter("global-param", "the-global-value"),
      ]);
      expect(config.templates[0].templateParameters).toStrictEqual([
        new PersistedParameter("template-param", "the-template-value"),
      ]);
    });

    test("getPersistedParameters with global and templateName with parameters", () => {
      // ARRANGE
      const config = new Config(
        new TemplateConfig("template", "1"),
        null,
        [
          new RanTemplate(
            "the-template",
            "1",
            new Source("some-source", "key"),
            [],
            [],
            [new PersistedParameter("template1", "the template parameter")]
          ),
        ],
        null,
        [new PersistedParameter("global1", "the global parameter")]
      );
      const parameters = {
        param1: 123,
      };

      // ACT
      const result = config.getPersistedParameters(parameters, "the-template");

      // ASSERT
      expect(result).toStrictEqual({
        global1: "the global parameter",
        param1: 123,
        template1: "the template parameter",
      });
    });
  });
});

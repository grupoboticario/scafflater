const fs = require("fs-extra");
const Config = require("./config");
const glob = require("glob");
const { TemplateConfig } = require("./template-config");
const { PartialConfig } = require("./partial-config");

jest.mock("fs-extra");
jest.mock("glob");

describe("ConfigLoader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe("save", () => {
    test("Received a directory as local path. Save .scafflater file in this directory", async () => {
      // ARRANGE
      const config = new Config(new TemplateConfig("some-template", "0.0.1"));
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return true;
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
      await config.save("/to/some/path");

      // ASSERT
      expect(fs.writeFile).toHaveBeenCalledWith(
        "/to/some/path/.scafflater",
        expected
      );
    });

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

    test("Received a file as local path, but the file exists and is not a .scafflater file. Should throw", async () => {
      // ARRANGE
      const config = new Config(new TemplateConfig("some-template", "0.0.1"));
      fs.lstat.mockResolvedValueOnce({
        isDirectory: () => {
          return false;
        },
      });
      fs.pathExists.mockResolvedValueOnce(true);

      // ACT && ASSERT
      await expect(
        config.save("/to/some/path/other-file.json")
      ).rejects.toThrow(
        "Error saving file /to/some/path/other-file.json: It is an existing file but is not a '.scafflater'. Use this to save only scafflater config"
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
        { root: "/some/valid/path" },
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
        { root: "/some/valid/path" },
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
});

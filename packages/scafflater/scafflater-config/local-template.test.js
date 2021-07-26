const { LocalPartial, LocalTemplate } = require("./local-template");
const Config = require("./config");
const ScafflaterOptions = require("../options");

jest.mock("fs-extra");
jest.mock("./config");

describe("Local Template", () => {
  describe("Local Partial", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    test("loadFromPath: the .scafflater file does not describe a partial, should throw", async () => {
      // ARRANGE
      Config.fromLocalPath.mockResolvedValue({
        filePath: "/some/valid/path/.scafflater",
        folderPath: "/some/valid/path",
        fileContent: {
          // theres no partial in info
        },
      });

      // ACT & ASSERT
      await expect(
        LocalPartial.loadFromPath("/some/valid/path/.scafflater")
      ).rejects.toThrowError(
        "'/some/valid/path/.scafflater': the scafflater file does not describe a partial."
      );
    });

    test("loadFromPath: the .scafflater file describe a partial, should return", async () => {
      // ARRANGE
      const mockedConfig = {
        filePath: "/some/valid/path/.scafflater",
        folderPath: "/some/valid/path",
        fileContent: {
          partial: {
            name: "the-partial-name",
            description: "The Partial Description",
            options: {
              targetName: "the-target",
            },
            parameters: [
              {
                name: "the-parameter",
              },
            ],
          },
        },
      };
      Config.fromLocalPath.mockResolvedValue(mockedConfig);

      // ACT
      const partial = await LocalPartial.loadFromPath("/some/valid/path");

      // ASSERT
      expect(partial).toBeInstanceOf(LocalPartial);
      expect(partial).toStrictEqual(
        new LocalPartial(
          "/some/valid/path",
          "the-partial-name",
          "The Partial Description",
          mockedConfig.fileContent.partial.options,
          mockedConfig.fileContent.partial.parameters
        )
      );
      expect(partial.options.targetName).toBe("the-target");
      expect(partial.parameters.length).toBe(1);
      expect(partial.parameters[0].name).toBe("the-parameter");
    });

    test("loadFromPath: the .scafflater file describe a partial and does not have options and parameters, should return the Partial with default options and parameters", async () => {
      // ARRANGE
      const mockedConfig = {
        filePath: "/some/valid/path/.scafflater",
        folderPath: "/some/valid/path",
        fileContent: {
          partial: {
            name: "the-partial-name",
            description: "The Partial Description",
          },
        },
      };
      Config.fromLocalPath.mockResolvedValue(mockedConfig);

      // ACT
      const partial = await LocalPartial.loadFromPath("/some/valid/path");

      // ASSERT
      expect(partial).toBeInstanceOf(LocalPartial);
      expect(partial).toStrictEqual(
        new LocalPartial(
          "/some/valid/path",
          "the-partial-name",
          "The Partial Description"
        )
      );
      expect(partial.options).toStrictEqual(new ScafflaterOptions());
      expect(partial.parameters).toStrictEqual([]);
    });
  });

  describe("Local Template", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    test("loadFromPath: config files not found, should return null", async () => {
      // ARRANGE
      Config.scanLocalPath.mockResolvedValue([]);

      // ACT
      const result = await LocalTemplate.loadFromPath("/some/valid/path");

      // ASSERT
      expect(result).toBeNull();
    });

    test("loadFromPath: template config files not found, should return null", async () => {
      // ARRANGE
      Config.scanLocalPath.mockResolvedValue([
        {
          config: {
            // No template info
          },
        },
      ]);

      // ACT
      const result = await LocalTemplate.loadFromPath("/some/valid/path");

      // ASSERT
      expect(result).toBeNull();
    });

    test("loadFromPath: more than one template config found, should throw", async () => {
      // ARRANGE
      Config.scanLocalPath.mockResolvedValue([
        {
          folderPath: "/some-path/template-1",
          config: {
            template: {
              name: "template-1",
              description: "Template 1",
            },
          },
        },
        {
          folderPath: "/some-path/template-1/partials/partial-1-1",
          config: {
            partial: {
              name: "partial-1-1",
              description: "Partial 1 of Template 1",
            },
          },
        },
        {
          folderPath: "/some-path/template-1/partials/partial-1-2",
          config: {
            partial: {
              name: "partial-1-2",
              description: "Partial 2 of Template 1",
            },
          },
        },
        {
          folderPath: "/some-path/template-2",
          config: {
            template: {
              name: "template-2",
              description: "Template 2",
            },
          },
        },
        {
          folderPath: "/some-path/template-2/partials/partial-2-1",
          config: {
            partial: {
              name: "partial-2-1",
              description: "Partial 1 of Template 2",
            },
          },
        },
      ]);

      // ACT
      const result = await LocalTemplate.loadFromPath("/some/valid/path");
      // ASSERT
      expect(result.length).toBe(2);
      expect(result[0]).toBeInstanceOf(LocalTemplate);
      expect(result[0].partials.length).toBe(2);
      expect(result[0].partials[0]).toBeInstanceOf(LocalPartial);

      expect(result[1]).toBeInstanceOf(LocalTemplate);
      expect(result[1].partials.length).toBe(1);
      expect(result[1].partials[0]).toBeInstanceOf(LocalPartial);
    });

    test("loadFromPath: partial is not over an template, should throw", async () => {
      // ARRANGE
      Config.scanLocalPath.mockResolvedValue([
        {
          folderPath: "/some-path/template-1",
          config: {
            template: {
              name: "template-1",
              description: "Template 1",
            },
          },
        },
        {
          folderPath: "/some-other/partial-1-1",
          filePath: "/some-other/partial-1-1/.scafflater",
          config: {
            partial: {
              name: "partial-1-1",
              description: "Partial 1 of Template 1",
            },
          },
        },
      ]);

      // ACT & ASSERT
      await expect(
        LocalTemplate.loadFromPath("/some/valid/path")
      ).rejects.toThrowError(
        "/some-other/partial-1-1/.scafflater: partial does not belong to any template."
      );
    });
  });
});

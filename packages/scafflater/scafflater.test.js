/* eslint-disable no-undef */
const { Scafflater } = require("./scafflater");
const { TemplateManager } = require("./template-manager");
const { ScafflaterOptions } = require("./options");
const {
  LocalTemplate,
  LocalPartial,
} = require("./scafflater-config/local-template");
const { Config } = require("./scafflater-config/config");
const RanTemplate = require("./scafflater-config/ran-template");
const RanPartial = require("./scafflater-config/ran-partial");
const { Source } = require("./scafflater-config/source");
const { TemplateSource } = require("./template-source");
const { TemplateCache } = require("./template-cache");

jest.mock("./scafflater-config/config");
jest.mock("./template-source");
jest.mock("./template-cache");
jest.mock("./fs-util");
jest.mock("./generator");

describe("Scafflater", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const templateSource = new TemplateSource();
  const templateCache = new TemplateCache();
  const templateManager = new TemplateManager(templateCache, templateSource);
  templateManager.config = new ScafflaterOptions();

  describe("Init", () => {
    test("First template init", async () => {
      // ARRANGE
      const parameters = {
        domain: "vs-one",
        systemDescription: "aaaaaaaa",
        systemName: "aaaaaaa",
        systemTeam: "vs-one-team",
        password: "password",
      };
      jest.spyOn(templateManager, "getTemplateFromSource").mockResolvedValue(
        new LocalTemplate(
          "/template/path",
          "/template/path/scafflater.jsonc",
          "template",
          "Template",
          "0.0.1",
          [],
          [],
          [
            {
              name: "password",
              mask: true,
            },
          ]
        )
      );
      const mockedConfig = {
        templates: [],
        save: jest.fn(),
        isInitialized: () => {
          return false;
        },
      };
      Config.mockReturnValue(mockedConfig);
      Config.fromLocalPath.mockResolvedValue({
        folderPath: "/template/path/",
        localPath: "/template/path/scafflater.jsonc",
        config: new Config(null, null, []),
      });

      // ACT
      const scafflater = new Scafflater({ annotate: false }, templateManager);
      await scafflater.init(
        "some/template/source/key",
        parameters,
        "last",
        "/some/target"
      );

      // ASSERT
      expect(mockedConfig.templates.length).toBe(1);
      expect(mockedConfig.save).toBeCalledWith(
        "/some/target/.scafflater/scafflater.jsonc"
      );
    });

    test("Not First template init", async () => {
      // ARRANGE
      const parameters = {
        domain: "vs-one",
        systemDescription: "aaaaaaaa",
        systemName: "aaaaaaa",
        systemTeam: "vs-one-team",
        password: "password",
      };
      templateManager.getTemplateFromSource.mockResolvedValue(
        new LocalTemplate(
          "/template/path",
          "template",
          "Template",
          "0.0.1",
          [],
          [],
          [
            {
              name: "password",
              mask: true,
            },
          ]
        )
      );
      const mockedConfig = {
        config: {
          templates: [
            {
              name: "existing-template",
              version: "existing-template-version",
              source: {
                name: "some-source",
                key: "existing-template-source-key",
              },
            },
          ],
          save: jest.fn(),
          isInitialized: () => {
            return false;
          },
        },
      };
      Config.fromLocalPath.mockResolvedValue(mockedConfig);

      // ACT
      const scafflater = new Scafflater({ annotate: false }, templateManager);
      await scafflater.init(
        "some/template/source/key",
        parameters,
        "last",
        "/some/target"
      );

      // ASSERT
      expect(mockedConfig.config.templates.length).toBe(2);
      expect(mockedConfig.config.save).toBeCalledWith(
        "/some/target/.scafflater/scafflater.jsonc"
      );
    });
  });

  test("Template is initialized. Should Throw", async () => {
    // ARRANGE
    const parameters = {
      domain: "vs-one",
      systemDescription: "aaaaaaaa",
      systemName: "aaaaaaa",
      systemTeam: "vs-one-team",
      password: "password",
    };
    templateManager.getTemplateFromSource.mockResolvedValue(
      new LocalTemplate(
        "/template/path",
        "template",
        "Template",
        "0.0.1",
        [],
        [],
        [
          {
            name: "password",
            mask: true,
          },
        ]
      )
    );
    const mockedConfig = {
      config: {
        templates: [
          {
            name: "existing-template",
            version: "existing-template-version",
            source: {
              name: "some-source",
              key: "existing-template-source-key",
            },
          },
        ],
        save: jest.fn(),
        isInitialized: () => {
          return true;
        },
      },
    };
    Config.fromLocalPath.mockResolvedValue(mockedConfig);

    // ACT & ASSERT
    const scafflater = new Scafflater({ annotate: false }, templateManager);
    await expect(
      scafflater.init("some/template/source/key", parameters, "/some/target")
    ).rejects.toThrowError(/The template is already initialized/);
  });

  describe("Run Partial", () => {
    const mockedConfig = {
      config: {
        templates: [
          new RanTemplate(
            "template",
            "0.0.1",
            new Source("some-source", "existing-template-source-key"),
            [],
            [new RanPartial("some-ran-partial", "This partial was ran")]
          ),
        ],
        save: jest.fn(),
      },
    };
    const mockedLocalTemplate = new LocalTemplate(
      "/some/path",
      "/some/path/scafflater.json",
      "template",
      "Local Template",
      "0.0.1",
      [
        new LocalPartial(
          "/some/path/to/partial",
          "some-partial",
          "This partial",
          {},
          [
            {
              name: "password",
              mask: true,
            },
          ]
        ),
      ]
    );

    test("The template is not initialized yet. Should throw", async () => {
      // ARRANGE
      Config.fromLocalPath.mockResolvedValue(mockedConfig);
      const scafflater = new Scafflater({ annotate: false }, templateManager);

      // ACT & ASSERT
      await expect(
        scafflater.runPartial("some-not-init-template", "the-partial")
      ).rejects.toThrow(
        "some-not-init-template: no initialized template found. You must init it before using."
      );
    });

    test("The template is initialized, but it could not be recovered. Should throw", async () => {
      // ARRANGE
      Config.fromLocalPath.mockResolvedValue(mockedConfig);
      jest.spyOn(templateManager, "getTemplate").mockResolvedValue(null);
      const scafflater = new Scafflater({ annotate: false }, templateManager);

      // ACT & ASSERT
      await expect(
        scafflater.runPartial("template", "the-partial")
      ).rejects.toThrow(
        "template: cannot load template from source ('some-source': 'existing-template-source-key')."
      );
    });

    test("No local partial found, and does not exists on source. Should throw.", async () => {
      // ARRANGE
      Config.fromLocalPath.mockResolvedValue(mockedConfig);
      jest
        .spyOn(templateManager, "getTemplate")
        .mockResolvedValue(mockedLocalTemplate);
      jest
        .spyOn(templateManager, "getTemplateFromSource")
        .mockResolvedValue(mockedLocalTemplate);
      const scafflater = new Scafflater({ annotate: false }, templateManager);

      // ACT & ASSERT
      await expect(
        scafflater.runPartial("template", "this-partial-doesn't-exist")
      ).rejects.toThrow(
        "this-partial-doesn't-exist: cannot load partial from template 'template' ('some-source': 'existing-template-source-key')."
      );
    });

    test("No local partial found but it does exists on source too. Should execute", async () => {
      // ARRANGE
      const parameters = {
        password: "some-password",
      };
      Config.fromLocalPath.mockResolvedValue(mockedConfig);
      jest
        .spyOn(templateManager, "getTemplate")
        .mockResolvedValue(mockedLocalTemplate);
      jest
        .spyOn(templateManager, "getTemplateFromSource")
        .mockResolvedValue(mockedLocalTemplate);
      const scafflater = new Scafflater({ annotate: false }, templateManager);

      // ACT
      await scafflater.runPartial(
        "template",
        "some-partial",
        parameters,
        "/some/target"
      );

      // ASSERT
      expect(mockedConfig.config.templates[0].partials.length).toBe(2);
      expect(mockedConfig.config.save).toBeCalledWith(
        "/some/target/.scafflater/scafflater.jsonc"
      );
    });
  });
});

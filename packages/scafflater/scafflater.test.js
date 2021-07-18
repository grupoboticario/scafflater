/* eslint-disable no-undef */
const Scafflater = require("./scafflater");
const fsUtil = require("./fs-util");
const TemplateManager = require("./template-manager");
const Generator = require("./generator");
const OptionsProvider = require("./options-provider");

jest.mock("./template-manager");
jest.mock("./fs-util");
jest.mock("./generator");

describe("Scafflater", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const generator = new Generator();
  const templateManager = new TemplateManager();
  templateManager.config = new OptionsProvider();

  test("Simple init", async () => {
    // ARRANGE
    const parameters = {
      domain: "vs-one",
      systemDescription: "aaaaaaaa",
      systemName: "aaaaaaa",
      systemTeam: "vs-one-team",
      password: "password",
    };
    templateManager.templateSource.getTemplate.mockResolvedValue({
      path: "the/template/path",
      config: {
        parameters: [
          {
            name: "password",
            mask: true,
          },
        ],
      },
    });
    fsUtil.pathExists.mockResolvedValue(true);
    fsUtil.readJSON.mockResolvedValueOnce({
      template: {
        name: "some-template",
        version: "some-version",
        source: {
          key: "the-template-source-key",
        },
      },
    });

    // ACT
    const scafflater = new Scafflater({ annotate: false });
    await scafflater.init(
      "some/template/source/key",
      parameters,
      "/some/target"
    );

    // ASSERT
    expect(fsUtil.writeJSON.mock.calls[0][0]).toBe("/some/target/.scafflater");
    expect(fsUtil.writeJSON.mock.calls[0][1].templates.length).toBe(1);
    expect(
      fsUtil.writeJSON.mock.calls[0][1].templates[0].parameters.password
    ).toBe("******");
    expect(
      fsUtil.writeJSON.mock.calls[0][1].templates[0].parameters.password
    ).toBe("******");
    expect(generator.constructor.mock.calls[0][0].options.annotate).toBe(false);
  });

  test("Target has .scafflater file, should append new template", async () => {
    // ARRANGE
    const parameters = {};
    templateManager.templateSource.getTemplate.mockResolvedValue({
      path: "the/template/path",
      config: {
        name: "new-template",
        version: "new-template-version",
        source: {
          key: "new-template-source-key",
        },
        parameters: [
          {
            name: "password",
            mask: true,
          },
        ],
      },
    });
    fsUtil.pathExists.mockResolvedValue(true);
    fsUtil.readJSON.mockResolvedValueOnce({
      templates: [
        {
          name: "existing-template",
          version: "existing-template-version",
          source: {
            key: "existing-template-source-key",
          },
        },
      ],
    });

    // ACT
    const scafflater = new Scafflater({ annotate: false });
    await scafflater.init(
      "some/template/source/key",
      parameters,
      "/some/target"
    );

    // ASSERT
    expect(fsUtil.writeJSON).toBeCalledWith("/some/target/.scafflater", {
      templates: [
        {
          name: "existing-template",
          version: "existing-template-version",
          source: {
            key: "existing-template-source-key",
          },
        },
        {
          name: "new-template",
          version: "new-template-version",
          source: {
            key: "new-template-source-key",
          },
          parameters: {
            password: "******",
          },
        },
      ],
    });
  });

  test("Target does not have .scafflater file, should append new template", async () => {
    // ARRANGE
    const parameters = {};
    templateManager.templateSource.getTemplate.mockResolvedValue({
      path: "the/template/path",
      config: {
        name: "new-template",
        version: "version-existing-template",
        source: {
          name: "some-source",
        },
        parameters: [
          {
            name: "password",
            mask: true,
          },
        ],
      },
    });
    fsUtil.pathExists.mockResolvedValue(false);

    // ACT
    const scafflater = new Scafflater({ annotate: false });
    await scafflater.init(
      "some/template/source/key",
      parameters,
      "/some/target"
    );

    // ASSERT
    expect(fsUtil.writeJSON).toBeCalledWith("/some/target/.scafflater", {
      templates: [
        {
          name: "new-template",
          version: "version-existing-template",
          source: {
            name: "some-source",
          },
          parameters: {
            password: "******",
          },
        },
      ],
    });
  });

  test("No local partial found, but it exists on source", async () => {
    // ARRANGE
    const parameters = {
      domain: "vs-one",
      systemDescription: "aaaaaaaa",
      systemName: "aaaaaaa",
      systemTeam: "vs-one-team",
      password: "password",
    };
    templateManager.templateSource.getTemplate.mockResolvedValue({
      path: "the/template/path",
    });
    templateManager.getPartial.mockResolvedValueOnce(null);
    templateManager.getPartial.mockResolvedValueOnce({
      config: {
        parameters: [
          {
            name: "password",
            mask: true,
          },
        ],
      },
      path: "the/partial/path",
    });
    templateManager.getTemplatePath.mockResolvedValueOnce(
      "/some/path/to/template"
    );
    fsUtil.readJSON.mockResolvedValueOnce({
      template: {
        name: "some-template",
        version: "some-version",
        source: {
          key: "the-template-source-key",
        },
      },
    });

    // ACT
    const scafflater = new Scafflater({});
    await scafflater.runPartial("some-partial", parameters, "/some/target");

    // ASSERT
    expect(templateManager.getTemplateFromSource.mock.calls[0][0]).toBe(
      "the-template-source-key"
    );
    expect(fsUtil.writeJSON.mock.calls[0][0]).toBe("/some/target/.scafflater");
    expect(
      fsUtil.writeJSON.mock.calls[0][1].partials[0].parameters.password
    ).toBe("******");
  });

  test("No local partial found, and it does not exists on source too", async () => {
    // ARRANGE
    const parameters = {
      domain: "vs-one",
      systemDescription: "aaaaaaaa",
      systemName: "aaaaaaa",
      systemTeam: "vs-one-team",
    };
    templateManager.templateSource.getTemplate.mockResolvedValue({
      path: "the/template/path",
    });
    templateManager.getPartial.mockResolvedValue(null);
    templateManager.getTemplatePath.mockResolvedValueOnce(
      "/some/path/to/template"
    );
    fsUtil.readJSON.mockResolvedValueOnce({
      template: {
        name: "some-template",
        version: "some-version",
        source: {
          key: "the-template-source-key",
        },
      },
    });

    // ACT
    const scafflater = new Scafflater({});
    const result = await scafflater.runPartial(
      "some-partial",
      parameters,
      "/some/target"
    );

    // ASSERT
    expect(result).toBe(null);
  });
});

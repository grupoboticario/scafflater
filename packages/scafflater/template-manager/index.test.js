/* eslint-disable node/no-unpublished-require */
/* eslint-disable no-undef */
const ScafflaterOptions = require("../options-provider");
const fsUtil = require("../fs-util");
const TemplateCache = require("../template-cache");
const TempDirCache = require("../template-cache/storages/temp-dir-cache");
const TemplateSource = require("../template-source");
const TemplateManager = require("./");

jest.mock("../util");
jest.mock("../fs-util");
jest.mock("../template-cache");
jest.mock("../template-source");

describe("Template Manager tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const templateCache = new TemplateCache();
  const templateSource = new TemplateSource();

  test("getTemplateFromSource", async () => {
    // ARRANGE
    const templateManager = new TemplateManager();
    templateManager.options = new ScafflaterOptions();
    templateCache.storeTemplate.mockResolvedValue("the/cache/path");
    templateSource.getTemplate.mockResolvedValue({ path: "some/path" });
    fsUtil.readJSON.mockResolvedValue({ name: "some-template" });

    // ACT
    const out = await templateManager.getTemplateFromSource("some/source/key");

    // ASSERT
    expect(templateSource.getTemplate.mock.calls.length).toBe(1);
    expect(templateCache.storeTemplate.mock.calls.length).toBe(1);
    expect(out).toStrictEqual({ name: "some-template" });
  });

  test("getTemplatePath", async () => {
    // ARRANGE
    const templateManager = new TemplateManager();

    // ACT
    const result = templateManager.getTemplatePath(
      "some-template",
      "some-version"
    );

    // ARRANGE
    expect(templateCache.getTemplatePath).toHaveBeenCalledTimes(1);
  });

  test("getPartial: Should return the partial template", async () => {
    // ARRANGE
    const partialPath = "the/partial/path";
    const configList = ["the/partial/path/.scafflater"];
    const config = {
      type: "partial",
      name: "the-partial-name",
      parameters: [],
    };
    templateCache.getTemplatePath.mockReturnValue(partialPath);
    fsUtil.getTempFolder.mockReturnValue("some/temp/folder");
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList);
    fsUtil.readJSON.mockReturnValue(config);
    const templateManager = new TemplateManager(config);

    // ACT
    const out = await templateManager.getPartial(
      "the-partial-name",
      "template"
    );

    // ASSERT
    expect(out.path).toBe("the/partial/path");
    expect(out.config).toBe(config);
  });

  test("getPartial: template does not exists, should return null", async () => {
    // ARRANGE
    const configList = ["the/partial/path/.scafflater"];
    const config = {
      name: "the-partial-name",
      parameters: [],
    };

    templateCache.getTemplatePath.mockReturnValue(null);
    fsUtil.getTempFolder.mockReturnValue("some/temp/folder");
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList);
    fsUtil.readJSON.mockReturnValue(config);
    const templateManager = new TemplateManager(config);

    // ACT
    const out = await templateManager.getPartial(
      "the-partial-name",
      "template"
    );

    // ASSERT
    expect(out).toBe(null);
  });

  test("getPartial: theres no partials on template, should return null", async () => {
    // ARRANGE
    templateCache.getTemplatePath.mockReturnValue("the/template/path");
    fsUtil.getTempFolder.mockReturnValue("some/temp/folder");
    fsUtil.listFilesByNameDeeply.mockReturnValue(null);
    const templateManager = new TemplateManager(new ScafflaterOptions());

    // ACT
    const out = await templateManager.getPartial(
      "the-partial-name",
      "template"
    );

    // ASSERT
    expect(out).toBe(null);
  });

  test("getPartial: the partial does not exists in the template, should return null", async () => {
    // ARRANGE
    const configList = ["the/partial/path/.scafflater"];
    const config = {
      name: "the-partial-name",
      parameters: [],
    };

    templateCache.getTemplatePath.mockReturnValue("some/template/path");
    fsUtil.getTempFolder.mockReturnValue("some/temp/folder");
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList);
    fsUtil.readJSON.mockReturnValue(config);
    const templateManager = new TemplateManager(config);

    // ACT
    const out = await templateManager.getPartial(
      "some-other-partial-name",
      "template"
    );

    // ASSERT
    expect(out).toBe(null);
  });

  test("listPartials: Should return list of partial templates", async () => {
    // ARRANGE
    const partialPath = "the/template/path";
    const configList = ["the/partial/path/.scafflater"];
    const config = {
      type: "partial",
      name: "the-partial-name",
      parameters: [],
    };
    templateCache.getTemplatePath.mockReturnValue(partialPath);
    fsUtil.getTempFolder.mockReturnValue("some/temp/folder");
    fsUtil.listFilesByNameDeeply.mockReturnValue(configList);
    fsUtil.readJSON.mockReturnValue(config);
    const templateManager = new TemplateManager(config);

    // ACT
    const out = await templateManager.listPartials("template");

    // ASSERT
    expect(out.length).toBe(1);
    expect(out[0].path).toBe("the/partial/path");
    expect(out[0].config).toBe(config);
  });

  test("getTemplateInfo: Should return a complete info about template", async () => {
    // ARRANGE
    fsUtil.getTempFolder.mockReturnValue("some/temp/folder");

    templateCache.getTemplatePath.mockReturnValueOnce("the/template/path");

    fsUtil.listFilesByNameDeeply.mockReturnValue([
      "the/partial/path/1/.scafflater",
      "the/partial/path/2/.scafflater",
    ]);

    fsUtil.readJSON.mockReturnValueOnce({
      type: "template",
      name: "some-template",
      description: "This is some template",
      version: "0.0.1",
    });

    fsUtil.readJSON.mockReturnValueOnce({
      type: "partial",
      name: "partial-1",
      description: "This is partial one",
      version: "0.0.1",
    });

    fsUtil.readJSON.mockReturnValueOnce({
      type: "partial",
      name: "partial-2",
      description: "This is partial teo",
      version: "0.0.1",
    });

    const templateManager = new TemplateManager({ scfFileName: ".scafflater" });

    // ACT
    const out = await templateManager.getTemplateInfo("some-template", "0.0.1");

    // ASSERT
    expect(out).toStrictEqual({
      type: "template",
      name: "some-template",
      description: "This is some template",
      version: "0.0.1",
      path: "the/template/path",
      partials: [
        {
          type: "partial",
          name: "partial-1",
          description: "This is partial one",
          version: "0.0.1",
          path: "the/partial/path/1",
        },
        {
          type: "partial",
          name: "partial-2",
          description: "This is partial teo",
          version: "0.0.1",
          path: "the/partial/path/2",
        },
      ],
    });
  });
});

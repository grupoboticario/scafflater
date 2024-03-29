import { jest } from "@jest/globals";
import ScafflaterOptions from "../options";
import {
  LocalTemplate,
  LocalPartial,
} from "../scafflater-config/local-template";

jest.unstable_mockModule("../fs-util", () => {
  const mock = {
    getTemplatePath: jest.fn(),
  };
  return {
    default: mock,
    ...mock,
  };
});

jest.unstable_mockModule("../util", () => {
  return {
    getTemplatePath: jest.fn(),
  };
});

const templateCacheMock = class {
  constructor() {
    this.getTemplate = jest.fn();
    this.storeTemplate = jest.fn();
  }
};
jest.unstable_mockModule("../template-cache", () => {
  return {
    default: templateCacheMock,
  };
});

const templateSourceMock = class {
  constructor() {
    this.getTemplate = jest.fn();
  }

  static resolveTemplateSourceFromSourceKey = jest.fn();
};
jest.unstable_mockModule("../template-source", () => {
  return {
    default: templateSourceMock,
  };
});

const TemplateCache = (await import("../template-cache")).default;
const TemplateSource = (await import("../template-source")).default;
const TemplateManager = (await import("./template-manager")).default;

describe("Template Manager tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  const templateCache = new TemplateCache();
  const templateSource = new TemplateSource();

  test("getTemplateFromSource", async () => {
    // ARRANGE
    TemplateSource.resolveTemplateSourceFromSourceKey.mockResolvedValue(
      templateSource,
    );
    const templateManager = new TemplateManager(templateCache, templateSource);
    templateManager.options = new ScafflaterOptions();
    templateCache.storeTemplate.mockResolvedValue(
      new LocalTemplate(
        "/cached/some/path",
        "/cached/some/path/scafflater.jsonc",
        "template",
        "Template",
        "0.0.1",
      ),
    );
    templateSource.getTemplate.mockResolvedValue(
      new LocalTemplate(
        "/some/path",
        "/some/path/scafflater.jsonc",
        "template",
        "Template",
        "0.0.1",
      ),
    );

    // ACT
    const out = await templateManager.getTemplateFromSource("some/source/key");

    // ASSERT
    expect(templateSource.getTemplate).toHaveBeenCalledTimes(1);
    expect(templateCache.storeTemplate).toHaveBeenCalledTimes(1);
    expect(out).toStrictEqual(
      new LocalTemplate(
        "/cached/some/path",
        "/cached/some/path/scafflater.jsonc",
        "template",
        "Template",
        "0.0.1",
      ),
    );
  });

  test("getTemplate", async () => {
    // ARRANGE
    const templateManager = new TemplateManager(templateCache, templateSource);

    // ACT
    templateManager.getTemplate("some-template", "some-version");

    // ARRANGE
    expect(templateCache.getTemplate).toHaveBeenCalledTimes(1);
  });

  test("getPartial: Should return the partial template", async () => {
    // ARRANGE
    templateCache.getTemplate.mockResolvedValue(
      new LocalTemplate(
        "some/path/to/template",
        "some/path/to/template/scafflater.jsonc",
        "template",
        "A template",
        "0.0.1",
        [new LocalPartial("the/partial/path", "partial-name", "A partial")],
      ),
    );
    const templateManager = new TemplateManager(templateCache, null, {});

    // ACT
    const out = await templateManager.getPartial("partial-name", "template");

    // ASSERT
    expect(out.name).toBe("partial-name");
  });

  test("getPartial: template does not exists, should return null", async () => {
    // ARRANGE
    templateCache.getTemplate.mockReturnValue(null);
    const templateManager = new TemplateManager(templateCache, null, {});

    // ACT
    const out = await templateManager.getPartial(
      "the-partial-name",
      "template",
    );

    // ASSERT
    expect(out).toBe(null);
  });

  test("getPartial: the partial does not exists in the template, should return null", async () => {
    // ARRANGE
    templateCache.getTemplate.mockReturnValue(
      new LocalTemplate(
        "some/path/to/template",
        "some/path/to/template/scafflater.jsonc",
        "template",
        "A template",
        "0.0.1",
        [new LocalPartial("the/partial/path", "partial-name", "A partial")],
      ),
    );
    const templateManager = new TemplateManager(templateCache, null, {});

    // ACT
    const out = await templateManager.getPartial(
      "some-other-partial-name",
      "template",
    );

    // ASSERT
    expect(out).toBe(null);
  });

  test("listPartials: Should return list of partial templates", async () => {
    // ARRANGE
    templateCache.getTemplate.mockReturnValue(
      new LocalTemplate(
        "some/path/to/template",
        "some/path/to/template/scafflater.jsonc",
        "template",
        "A template",
        "0.0.1",
        [new LocalPartial("the/partial/path", "partial-name", "A partial")],
      ),
    );
    const templateManager = new TemplateManager(templateCache, null, {});

    // ACT
    const out = await templateManager.listPartials("template");

    // ASSERT
    expect(out.length).toBe(1);
    expect(out[0].folderPath).toBe("the/partial/path");
  });

  test("listPartials: The template does not exists. Should return null", async () => {
    // ARRANGE
    templateCache.getTemplate.mockReturnValue(null);
    const templateManager = new TemplateManager(templateCache, null, {});

    // ACT
    const out = await templateManager.listPartials("template");

    // ASSERT
    expect(out).toBeNull();
  });
});

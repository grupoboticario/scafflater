/* eslint-disable no-undef */
const DirCache = require("./dir-cache");
const fsUtil = require("../../fs-util");
const path = require("path");
const { LocalTemplate } = require("../../scafflater-config/local-template");

jest.mock("../../fs-util");

describe("Dir template Cache", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("getTemplate: get template by version", async () => {
    // ARRANGE
    const dirCache = new DirCache("/some/path");
    const t = new LocalTemplate(
      "/some/path/template",
      "template",
      "Template",
      "0.0.1"
    );
    jest.spyOn(LocalTemplate, "loadFromPath").mockResolvedValue([t]);
    // ACT
    const templateOk = await dirCache.getTemplate("template", "0.0.1");
    const templateNotFound = await dirCache.getTemplate(
      "template-does-not-exists",
      "0.0.2"
    );

    // ASSERT
    expect(templateOk).toStrictEqual(
      new LocalTemplate("/some/path/template", "template", "Template", "0.0.1")
    );
    expect(templateNotFound).toBeNull();
  });

  test("getTemplate: get most recent version", async () => {
    // ARRANGE
    const dirCache = new DirCache("/some/path");
    jest
      .spyOn(LocalTemplate, "loadFromPath")
      .mockResolvedValue([
        new LocalTemplate(
          "/some/path/template",
          "template",
          "Template",
          "0.0.1"
        ),
        new LocalTemplate(
          "/some/path/template",
          "template",
          "Template",
          "0.0.2"
        ),
        new LocalTemplate(
          "/some/path/other-template",
          "other-template",
          "Template",
          "0.0.3"
        ),
      ]);

    // ACT
    const templateOk = await dirCache.getTemplate("template");
    const templateNotFound = await dirCache.getTemplate(
      "template-does-not-exists"
    );

    // ASSERT
    expect(templateOk).toStrictEqual(
      new LocalTemplate("/some/path/template", "template", "Template", "0.0.2")
    );
    expect(templateNotFound).toBeNull();
  });

  test("storeTemplate: Should copy to the local folder", async () => {
    // ARRANGE
    fsUtil.readJSON.mockReturnValue({
      name: "some-name",
      version: "some-version",
    });
    const p = "path/to/some/template";
    const dirCache = new DirCache("path/to/some/template");
    jest
      .spyOn(LocalTemplate, "loadFromPath")
      .mockResolvedValue([
        new LocalTemplate(
          "path/to/some/template/some-name/some-version",
          "some-name",
          "Template",
          "some-version"
        ),
      ]);

    // ACT
    await dirCache.storeTemplate(p);

    // ASSERT
    expect(fsUtil.copyEnsuringDest.mock.calls[0][0]).toBe(p);
    expect(fsUtil.copyEnsuringDest.mock.calls[0][1]).toBe(
      "path/to/some/template/some-name/some-version"
    );
  });

  test("listCachedTemplates: List templates should list stored templates", async () => {
    // ARRANGE
    const dirCache = new DirCache("some/path");
    jest
      .spyOn(LocalTemplate, "loadFromPath")
      .mockResolvedValue([
        new LocalTemplate(
          "/some/path/template",
          "template",
          "Template",
          "0.0.1"
        ),
        new LocalTemplate(
          "/some/path/template",
          "template",
          "Template",
          "0.0.2"
        ),
        new LocalTemplate(
          "/some/path/other-template",
          "other-template",
          "Template",
          "0.0.3"
        ),
      ]);

    // ACT
    const out = await dirCache.listCachedTemplates(path);

    // ASSERT
    expect(out.length).toBe(3);
    expect(out[0].version).toBe("0.0.1");
    expect(out[1].version).toBe("0.0.2");
    expect(out[2].version).toBe("0.0.3");
  });
});

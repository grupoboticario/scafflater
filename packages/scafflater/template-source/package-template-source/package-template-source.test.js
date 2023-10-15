import { jest } from "@jest/globals";
import util from "util";
import { LocalTemplate } from "../../scafflater-config/local-template";
import { ScafflaterFileNotFoundError } from "../../errors";

jest.unstable_mockModule("../../fs-util", () => {
  const mock = {
    getTempFolderSync: jest.fn(),
    getTempFolder: jest.fn(),
    copy: jest.fn(),
    pathExists: jest.fn(),
  };

  return {
    __esModule: true,
    default: mock,
    ...mock,
  };
});

const fsUtil = (await import("../../fs-util")).default;
const PackageTemplateSource = (await import("./package-template-source"))
  .default;

describe("getTemplate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  jest.setTimeout(15000);

  test("get template", async () => {
    const packageTemplateSource = new PackageTemplateSource();
    const virtualFolder = "/some/virtual/folder";
    fsUtil.getTempFolderSync.mockReturnValue("some/temp/folder");
    fsUtil.getTempFolder.mockReturnValue("some/temp/folder");

    jest
      .spyOn(LocalTemplate, "loadFromPath")
      .mockResolvedValue([
        new LocalTemplate(
          "/some/virtual/folder",
          "template-name",
          "the template",
          "0.0.0",
          [],
          {},
          [{ name: "some-parameter" }],
        ),
      ]);
    jest.spyOn(util, "promisify").mockReturnValue(() => {
      return { stdout: "username", stderr: "" };
    });
    await expect(
      packageTemplateSource.getTemplate("template-fastify", virtualFolder),
    ).rejects.toBeInstanceOf(ScafflaterFileNotFoundError);
  });
});

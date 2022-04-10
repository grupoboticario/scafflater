/* eslint-disable no-undef */
const OctokitTemplateSource = require("./octokit-template-source");
const { NoVersionAvailableError } = require("../errors");
const { Octokit } = require("@octokit/rest");
const path = require("path");
const fs = require("fs");
const {
  ScafflaterFileNotFoundError,
  TemplateDefinitionNotFound,
} = require("../../errors");

class MockedHttpError extends Error {
  constructor(status) {
    super();
    this.status = status;
  }
}

const getByteArray = (filePath) => {
  const fileData = fs.readFileSync(filePath).toString("hex");
  const result = [];
  for (let i = 0; i < fileData.length; i += 2)
    result.push("0x" + fileData[i] + "" + fileData[i + 1]);
  return result;
};

describe("getTempalte", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("Get head", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();
    new Octokit().request.mockResolvedValueOnce({
      data: getByteArray(path.resolve(__dirname, "__mocks__/test-ok.zip")),
    });

    // ACT
    await octokitTemplateSource.getTemplate(
      "https://github.com/gbsandbox/pdd-template-javascript-fastify",
      "head"
    );

    // ASSERT
    expect(true).toBeTruthy();
  });

  test("Missing .scafflater folder", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();
    new Octokit().request.mockResolvedValueOnce({
      data: getByteArray(
        path.resolve(__dirname, "__mocks__/test-missing-scf-folder.zip")
      ),
    });

    // ACT
    const promise = octokitTemplateSource.getTemplate(
      "https://github.com/gbsandbox/pdd-template-javascript-fastify",
      "head"
    );

    // ASSERT
    await expect(promise).rejects.toThrowError(ScafflaterFileNotFoundError);
  });

  test("Missing template definition on .scafflater file", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();
    new Octokit().request.mockResolvedValueOnce({
      data: getByteArray(
        path.resolve(__dirname, "__mocks__/test-missing-template-notation.zip")
      ),
    });

    // ACT
    const promise = octokitTemplateSource.getTemplate(
      "https://github.com/gbsandbox/pdd-template-javascript-fastify",
      "head"
    );

    // ASSERT
    await expect(promise).rejects.toThrowError(TemplateDefinitionNotFound);
  });

  test("Get tag", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();
    new Octokit().request.mockResolvedValueOnce({
      data: {
        ref: "refs/tags/some-version",
        node_id: "REF_kwDOGI--zrByZWZzL3RhZ3MvdjAuMC4y",
        url: "https://api.github.com/repos/gbsandbox/pdd-template-javascript-fastify/git/refs/tags/some-version",
        object: {
          sha: "212d40e59a96ca1bb22d6dd4cf559f3b9bf59d18",
          type: "commit",
          url: "https://api.github.com/repos/gbsandbox/pdd-template-javascript-fastify/git/commits/212d40e59a96ca1bb22d6dd4cf559f3b9bf59d18",
        },
      },
    });
    new Octokit().request.mockResolvedValueOnce({
      data: getByteArray(path.resolve(__dirname, "__mocks__/test-ok.zip")),
    });

    // ACT
    await octokitTemplateSource.getTemplate(
      "https://github.com/gbsandbox/pdd-template-javascript-fastify",
      "some-tag"
    );

    // ASSERT
    expect(true).toBeTruthy();
  });
});

describe("getLastVersion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("No release is available, should throw", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();

    new Octokit().request.mockImplementation(() => {
      throw new MockedHttpError(404);
    });

    // ACT
    const promise = octokitTemplateSource.getLastVersion(
      "https://github.com/gbsandbox/pdd-template-crossplane-aws"
    );

    // ASSERT
    await expect(promise).rejects.toThrowError(NoVersionAvailableError);
  });

  test("A valid release is returned, should return this as last release", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();

    new Octokit().request.mockResolvedValueOnce({
      data: { draft: false, prerelease: false, name: "v0.0.2" },
    });

    // ACT
    const lastVersion = await octokitTemplateSource.getLastVersion(
      "some version"
    );

    // ASSERT
    expect(lastVersion).toBe("v0.0.2");
  });
});

describe("getAvailableRef", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("The version is an available tag, should return ref", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();

    new Octokit().request.mockResolvedValueOnce({
      data: {
        ref: "refs/tags/some-version",
        node_id: "REF_kwDOGI--zrByZWZzL3RhZ3MvdjAuMC4y",
        url: "https://api.github.com/repos/gbsandbox/pdd-template-javascript-fastify/git/refs/tags/some-version",
        object: {
          sha: "212d40e59a96ca1bb22d6dd4cf559f3b9bf59d18",
          type: "commit",
          url: "https://api.github.com/repos/gbsandbox/pdd-template-javascript-fastify/git/commits/212d40e59a96ca1bb22d6dd4cf559f3b9bf59d18",
        },
      },
    });

    // ACT
    const result = await octokitTemplateSource.getAvailableRef(
      "https://github.com/some-org/some-repo",
      "some-version"
    );

    // ASSERT
    expect(result).toStrictEqual({ refType: "tag", version: "some-version" });
    expect(new Octokit().request).toBeCalledTimes(1);
    expect(new Octokit().request).toBeCalledWith(
      "GET /repos/{owner}/{repo}/git/ref/tags/{tag_name}",
      expect.objectContaining({
        owner: "some-org",
        repo: "some-repo",
        tag_name: "some-version",
      })
    );
  });

  test("The version is an available branch, should return ref", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();

    new Octokit().request.mockImplementationOnce(() => {
      throw new MockedHttpError(404);
    });
    new Octokit().request.mockResolvedValueOnce({
      data: [
        {
          name: "some-version",
        },
      ],
    });

    // ACT
    const result = await octokitTemplateSource.getAvailableRef(
      "https://github.com/some-org/some-repo",
      "some-version"
    );

    // ASSERT
    expect(result).toStrictEqual({
      refType: "branch",
      version: "some-version",
    });
    expect(new Octokit().request).toBeCalledTimes(2);
    expect(new Octokit().request).toBeCalledWith(
      "GET /repos/{owner}/{repo}/git/ref/tags/{tag_name}",
      expect.objectContaining({
        owner: "some-org",
        repo: "some-repo",
        tag_name: "some-version",
      })
    );
    expect(new Octokit().request).toBeCalledWith(
      "GET /repos/{owner}/{repo}/branches/{branch}",
      expect.objectContaining({
        owner: "some-org",
        repo: "some-repo",
        branch: "some-version",
      })
    );
  });

  test("The version is an available release, should return ref", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();

    new Octokit().request.mockImplementationOnce(() => {
      throw new MockedHttpError(404);
    });
    new Octokit().request.mockImplementationOnce(() => {
      throw new MockedHttpError(404);
    });
    new Octokit().request.mockResolvedValueOnce({
      data: [
        {
          name: "other-version",
          tag_name: "other-tag",
        },
      ],
    });
    new Octokit().request.mockResolvedValueOnce({
      data: [
        {
          name: "some-version",
          tag_name: "some-tag",
        },
      ],
    });

    // ACT
    const result = await octokitTemplateSource.getAvailableRef(
      "https://github.com/some-org/some-repo",
      "some-version"
    );

    // ASSERT
    expect(result).toStrictEqual({
      refType: "tag",
      version: "some-tag",
    });
    expect(new Octokit().request).toBeCalledTimes(4);
    expect(new Octokit().request).toBeCalledWith(
      "GET /repos/{owner}/{repo}/git/ref/tags/{tag_name}",
      expect.objectContaining({
        owner: "some-org",
        repo: "some-repo",
        tag_name: "some-version",
      })
    );
    expect(new Octokit().request).toBeCalledWith(
      "GET /repos/{owner}/{repo}/branches/{branch}",
      expect.objectContaining({
        owner: "some-org",
        repo: "some-repo",
        branch: "some-version",
      })
    );
  });

  test("The version does not exists, should return false", async () => {
    // ARRANGE
    const octokitTemplateSource = new OctokitTemplateSource();

    new Octokit().request.mockImplementationOnce(() => {
      throw new MockedHttpError(404);
    });
    new Octokit().request.mockImplementationOnce(() => {
      throw new MockedHttpError(404);
    });
    new Octokit().request.mockResolvedValueOnce({
      data: [
        {
          name: "other-version",
        },
      ],
    });
    new Octokit().request.mockResolvedValueOnce({
      data: [],
    });

    // ACT
    const result = await octokitTemplateSource.getAvailableRef(
      "https://github.com/some-org/some-repo",
      "some-version"
    );

    // ASSERT
    expect(result).toBeNull();
  });
});

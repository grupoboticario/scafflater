/* eslint-disable no-undef */
const GitUtil = require("../git-util");
const git = require("isomorphic-git");
const fs = require("../fs-util");

jest.mock("isomorphic-git");
jest.mock("../fs-util");

test("Clone repo", async () => {
  // ARRANGE
  fs.getTempFolder.mockResolvedValue("/some/temp/path");

  // ACT
  const temp = await GitUtil.cloneToTempPath("some-repo");

  // ASSERT
  expect(temp).toBe("/some/temp/path");
  expect(git.clone.mock.calls[0][0].url).toBe("some-repo");
  expect(git.clone.mock.calls[0][0].dir).toBe("/some/temp/path");
});

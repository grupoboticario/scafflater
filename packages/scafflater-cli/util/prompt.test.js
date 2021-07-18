const Prompt = require("./prompt");
const inquirer = require("inquirer");

jest.mock("inquirer");

test("Prompt questions", async () => {
  // ARRANGE
  const questions = [
    {
      type: "input",
      name: "name",
      message: "Component Name",
      regex: "[a-z-]{3,}",
    },
    {
      type: "input",
      name: "bucket-name",
      message: "Bucket Name",
    },
  ];

  // ACT
  await Prompt.prompt(questions);

  // ASSERT
  expect(inquirer.prompt.mock.calls.length).toBe(1);
  expect(typeof inquirer.prompt.mock.calls[0][0][0].validate).toBe("function");
  expect(inquirer.prompt.mock.calls[0][0][1].validate).toBeUndefined();
});

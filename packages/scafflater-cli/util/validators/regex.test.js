import reValidate from "./regex";

test("The input is valid, should return true", () => {
  // ARRANGE
  const question = {
    type: "input",
    name: "domainName",
    message: "Domain/VS Name",
    regex: "[a-z-]{4,}",
  };
  const input = "some-valid-input";

  // ACT
  const result = reValidate(question, input);

  // ASSERT
  expect(result).toBe(true);
});

test("The input is invalid, should the message", () => {
  // ARRANGE
  const question = {
    type: "input",
    name: "domainName",
    message: "Domain/VS Name",
    regex: "[a-z-]{4,}",
  };
  const input = "some invalid input";

  // ACT
  const result = reValidate(question, input);

  // ASSERT
  expect(result).toBe(
    `Domain/VS Name: The value 'some invalid input' does note match the regex '/[a-z-]{4,}/g'`,
  );
});

const Appender = require("./appender");

describe("Appender", () => {
  const existingContent = `some existing content`;
  const newContent = `some new content`;
  const appender = new Appender();

  test("Append content", async () => {
    // ARRANGE
    const ctx = {
      options: {
        appendStrategy: "append",
      },
    };

    // ACT
    const result = await appender.append(ctx, newContent, existingContent);

    // ASSERT
    expect(result.result).toBe(`some existing content

some new content`);
  });

  test("Replace content", async () => {
    // ARRANGE
    const ctx = {
      options: {
        appendStrategy: "replace",
      },
    };

    // ACT
    const result = await appender.append(ctx, newContent, existingContent);

    // ASSERT
    expect(result.result).toBe(`some new content`);
  });

  test("String to be appended is empty", async () => {
    // ARRANGE
    const ctx = {
      options: {
        appendStrategy: "replace",
      },
    };

    // ACT
    const result = await appender.append(ctx, "", existingContent);

    // ASSERT
    expect(result.result).toBe(existingContent);
  });
});

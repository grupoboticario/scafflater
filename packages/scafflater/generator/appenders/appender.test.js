import Appender from "./appender";

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

  test("Append if exists", async () => {
    // ARRANGE
    const ctx = {
      options: {
        appendStrategy: "appendIfExists",
      },
    };

    // ACT
    const result1 = await appender.append(ctx, newContent, "");
    const result2 = await appender.append(ctx, newContent, existingContent);

    // ASSERT
    expect(result1.result).toBe("");
    expect(result2.result).toBe(`some existing content

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

  test("Replace content if exists", async () => {
    // ARRANGE
    const ctx = {
      options: {
        appendStrategy: "replaceIfExists",
      },
    };

    // ACT
    const result1 = await appender.append(ctx, newContent, "");
    const result2 = await appender.append(ctx, newContent, existingContent);

    // ASSERT
    expect(result1.result).toBe("");
    expect(result2.result).toBe(`some new content`);
  });

  test("Ignore", async () => {
    // ARRANGE
    const ctx = {
      options: {
        appendStrategy: "ignore",
      },
    };

    // ACT
    const result1 = await appender.append(ctx, newContent, existingContent);
    const result2 = await appender.append(ctx, newContent, "");

    // ASSERT
    expect(result1.result).toBe(`some existing content`);
    expect(result2.result).toBe(`some new content`);
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

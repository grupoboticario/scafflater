import TemplateCache from "./template-cache";
import LocalTemplateCache from "./home-dir-cache";

describe("TemplateCache", () => {
  test("Throws an exception when the storage does not exists", async () => {
    // ARRANGE

    // ACT
    const ret = TemplateCache.getTemplateCache({ cacheStorage: "bla" });

    // and ASSERT
    await expect(ret).rejects.toThrowError(
      "There's no module for source 'bla'"
    );
  });

  test("Gets the template storage in config", async () => {
    // ARRANGE

    // ACT
    const result = await TemplateCache.getTemplateCache({
      cacheStorage: "homeDir",
    });

    // ASSERT
    // eslint-disable-next-line no-proto
    expect(result.__proto__ instanceof TemplateCache).toBe(true);
    expect(result instanceof LocalTemplateCache).toBe(true);
  });

  test("Constructor call must throw", () => {
    expect(() => {
      // NOSONAR
      // eslint-disable-next-line no-new
      new TemplateCache();
    }).toThrow();
  });

  test("Implementation Constructor call must throw", () => {
    expect(() => {
      // NOSONAR
      // eslint-disable-next-line no-new
      new LocalTemplateCache();
    }).not.toThrow();
  });
});

const { TemplateCache } = require("./");
const LocalTemplateCache = require("./home-dir-cache");

test("Throws an exception when the storage does not exists", () => {
  // ARRANGE
  const config = { cacheStorage: "bla" };

  // ACT and ASSERT
  expect(() => {
    TemplateCache.getTemplateCache(config);
  }).toThrowError("There's no module for source 'bla'");
});

test("Gets the template storage in config", () => {
  // ARRANGE
  const config = { cacheStorage: "homeDir" };

  // ACT
  const result = TemplateCache.getTemplateCache(config);

  // ASSERT
  // eslint-disable-next-line no-proto
  expect(result.__proto__ instanceof TemplateCache).toBe(true);
  expect(result instanceof LocalTemplateCache).toBe(true);
});

test("Constructor call must throw", () => {
  expect(() => {
    // NOSONAR
    new TemplateCache();
  }).toThrow();
});

test("Implementation Constructor call must throw", () => {
  expect(() => {
    // NOSONAR
    new LocalTemplateCache();
  }).not.toThrow();
});

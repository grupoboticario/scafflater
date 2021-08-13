/* eslint-disable no-undef */
const { ScafflaterOptions } = require("../../options");
const { RegionProvider, Region, RegionTag, RegionTagType } = require(".");

test("List regions in a well formatted content", () => {
  // ARRANGE
  const regionProvider = new RegionProvider(new ScafflaterOptions());
  const str = `This is a sample contet
  # @scf-region sample-region

  # @scf-region inner-sample-region

  And this is a region

  # @end-scf-region 

  # @end-scf-region 
  
  # @scf-region another-sample-region

  And this is another region

  # @end-scf-region

  And here is a space after the region
  `;

  // ACT
  const regions = regionProvider.getRegions(str);

  // ASSERT
  expect(regions.length).toBe(3);
  expect(regions[0].name).toBe("inner-sample-region");
  expect(regions[0].parentRegion.name).toBe("sample-region");
  expect(regions[0].content).toBe(`

  And this is a region

`);
  expect(regions[1].name).toBe("sample-region");
  expect(regions[2].name).toBe("another-sample-region");
});

test("Parse content with not started region, should throw an exception", () => {
  // ARRANGE
  const regionProvider = new RegionProvider(new ScafflaterOptions());
  const str = `This is a sample contet

  # @end-scf-region 

  And here is a space after the region
  `;

  // ACT
  expect(() => {
    regionProvider.getRegions(str);
  }).toThrowError();
});

test("Parse content with not finished region, should throw an exception", () => {
  // ARRANGE
  const regionProvider = new RegionProvider(new ScafflaterOptions());
  const str = `This is a sample contet
  # @scf-region sample-region

  And this is a region


  And here is a space after the region
  `;

  // ACT
  expect(() => {
    regionProvider.getRegions(str);
  }).toThrowError();
});

test("Appends an simple region", async () => {
  // ARRANGE
  const regionProvider = new RegionProvider(new ScafflaterOptions());
  const region = new Region(
    null,
    new RegionTag("some-region", 0, 0, RegionTagType.Start),
    RegionTag.unknown(),
    "some content"
  );

  // ACT
  const result = await regionProvider.appendRegion(region, "original content");

  // ASSERT
  expect(result).toBe(`original content
# @scf-region some-region
some content
# @end-scf-region
`);
});

test("Build a nested region", async () => {
  // ARRANGE
  const regionProvider = new RegionProvider(new ScafflaterOptions());
  const parentRegion = new Region(
    null,
    new RegionTag("parent-region", 0, 0, RegionTagType.Start),
    RegionTag.unknown(),
    "some content"
  );
  const region = new Region(
    parentRegion,
    new RegionTag("child-region", 0, 0, RegionTagType.Start),
    RegionTag.unknown(),
    "some content"
  );

  // ACT
  const result = await regionProvider.appendRegion(region, "original content");

  // ASSERT
  expect(result).toBe(`original content
# @scf-region parent-region
# @scf-region child-region
some content
# @end-scf-region

# @end-scf-region
`);
});

import ScafflaterOptions from "../../options";
import RegionAppender from "./region-appender";

test("Append to an existing region", async () => {
  // ARRANGE
  const src = `This content is not in regions
  # @scf-region test-region

  some new content

  # @scf-region inner-test-region

  some new inner region content

  # @end-scf-region

  # @end-scf-region

  # @scf-region test-region2

  other new content

  # @end-scf-region

  And this one is not in region too`;
  const dst = `
  # @scf-region test-region

  some existing content

  # @scf-region inner-test-region

  some existing inner test content

  # @end-scf-region

  # @end-scf-region

  # @scf-region test-region2

  other existing content

  # @end-scf-region
  `;
  const context = {
    options: new ScafflaterOptions({ annotate: false }),
  };
  const regionAppender = new RegionAppender();

  // ACT
  const result = await regionAppender.append(context, src, dst);

  // ASSERT
  expect(result.result).toEqual(`
  # @scf-region test-region

  some existing content

  # @scf-region inner-test-region

  some existing inner test content

  some new inner region content

  # @end-scf-region

  some new content

  # @end-scf-region

  # @scf-region test-region2

  other existing content

  other new content

  # @end-scf-region
  `);
  expect(result.notAppended).toEqual(`This content is not in regions

  And this one is not in region too`);
});

test("Replace an existing region", async () => {
  // ARRANGE
  const src = `
  # @scf-region test-region
  # @scf-option {"appendStrategy":"replace"}

  some new content

  # @end-scf-region`;
  const dst = `This content is not in regions
  # @scf-region test-region

  This is the existing content

  # @end-scf-region

  And this one is not in region too`;

  const context = {
    options: new ScafflaterOptions({ annotate: false }),
  };
  const regionAppender = new RegionAppender();

  // ACT
  const result = await regionAppender.append(context, src, dst);

  // ASSERT
  expect(result.result).toEqual(`This content is not in regions
  # @scf-region test-region
  # @scf-option {"appendStrategy":"replace"}

  some new content

  # @end-scf-region

  And this one is not in region too`);
});

test("Replace if exist region", async () => {
  // ARRANGE
  const src = `
  # @scf-region test-region
  # @scf-option {"appendStrategy":"replaceIfExists"}

  some new content

  # @end-scf-region`;
  const existingDst = `This content is not in regions
  # @scf-region test-region

  This is the existing content

  # @end-scf-region

  And this one is not in region too`;

  const notExistingDst = `This content is not in regions

  And this one is not in region too`;

  const context = {
    options: new ScafflaterOptions({ annotate: false }),
  };
  const regionAppender = new RegionAppender();

  // ACT
  const resultExisting = await regionAppender.append(context, src, existingDst);
  const resultNotExisting = await regionAppender.append(
    context,
    src,
    notExistingDst,
  );

  // ASSERT
  expect(resultExisting.result).toEqual(`This content is not in regions
  # @scf-region test-region
  # @scf-option {"appendStrategy":"replaceIfExists"}

  some new content

  # @end-scf-region

  And this one is not in region too`);

  expect(resultNotExisting.result).toEqual(`This content is not in regions

  And this one is not in region too`);
});

test("Ignore", async () => {
  // ARRANGE
  const src = `
  # @scf-region test-region
  # @scf-option {"appendStrategy":"ignore"}

  some new content

  # @end-scf-region`;
  const existingDst = `This content is not in regions
  # @scf-region test-region

  This is the existing content

  # @end-scf-region

  And this one is not in region too`;

  const notExistingDst = `This content is not in regions`;

  const context = {
    options: new ScafflaterOptions({ annotate: false }),
  };
  const regionAppender = new RegionAppender();

  // ACT
  const resultExisting = await regionAppender.append(context, src, existingDst);
  const resultNotExisting = await regionAppender.append(
    context,
    src,
    notExistingDst,
  );

  // ASSERT
  expect(resultExisting.result).toEqual(`This content is not in regions
  # @scf-region test-region

  This is the existing content

  # @end-scf-region

  And this one is not in region too`);

  expect(resultNotExisting.result).toEqual(`This content is not in regions
# @scf-region test-region

  # @scf-option {"appendStrategy":"ignore"}

  some new content

# @end-scf-region
`);
});

test("Append to non existing region, should create region", async () => {
  // ARRANGE
  const src = `
  # @scf-region new-test-region

  some new content

  # @scf-region new-inner-test-region

  some new inner region content

  # @end-scf-region

  # @end-scf-region

  # @scf-region new-test-region2

  other new content

  # @end-scf-region`;
  const dst = `
  some content without regions
  `;
  const context = {
    options: new ScafflaterOptions({ annotate: false }),
  };
  const regionAppender = new RegionAppender();

  // ACT
  const result = await regionAppender.append(context, src, dst);

  // ASSERT
  expect(result.result).toEqual(`
  some content without regions
  
# @scf-region new-test-region
# @scf-region new-inner-test-region

  some new inner region content

# @end-scf-region

  some new content

# @end-scf-region

# @scf-region new-test-region2

  other new content

# @end-scf-region
`);
  expect(result.notAppended).toEqual("");
});

import caseHelper from "./case";
import Handlebars from "handlebars";

test("Cases", () => {
  expect(caseHelper("camelCase", "test string")).toBe("testString");
  expect(caseHelper("capitalCase", "test string")).toBe("Test String");
  expect(caseHelper("constantCase", "test string")).toBe("TEST_STRING");
  expect(caseHelper("dotCase", "test string")).toBe("test.string");
  expect(caseHelper("headerCase", "test string")).toBe("Test-String");
  // expect(caseHelper("trainCase", "test string")).toBe("Test-String");
  expect(caseHelper("noCase", "testString")).toBe("test string");
  // expect(caseHelper("kebabCase", "test string")).toBe("test-string");
  expect(caseHelper("paramCase", "test string")).toBe("test-string");
  expect(caseHelper("noCaseAndTitle", "test-a-string")).toBe("Test a String");
  expect(caseHelper("lowerCase", "Test")).toBe("test");
  expect(caseHelper("upperCase", "Test")).toBe("TEST");
  expect(caseHelper("lowerCaseFirst", "TEST")).toBe("tEST");
  expect(caseHelper("upperCaseFirst", "test")).toBe("Test");
});

test("Handlebars call", () => {
  Handlebars.registerHelper("case", caseHelper);
  expect(
    Handlebars.compile('{{case "camelCase" "test string" }}', {
      noEscape: true,
    })({}),
  ).toBe("testString");
});

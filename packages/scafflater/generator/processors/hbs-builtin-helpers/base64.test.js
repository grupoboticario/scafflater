const base64Helper = require("./base64");
const Handlebars = require("handlebars");

test("Handlebars call", () => {
  Handlebars.registerHelper("base64", base64Helper);
  expect(
    Handlebars.compile('{{base64 "warning456" }}', {
      noEscape: true,
    })({})
  ).toBe("d2FybmluZzQ1Ng==");
});

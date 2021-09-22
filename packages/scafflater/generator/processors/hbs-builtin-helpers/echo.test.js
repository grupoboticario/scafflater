const echoHelper = require("./echo");
const Handlebars = require("handlebars");

test("Handlebars call", () => {
  Handlebars.registerHelper("echo", echoHelper);
  expect(
    Handlebars.compile('{{echo "testing" }}', {
      noEscape: true,
    })({})
  ).toBe("testing");
});

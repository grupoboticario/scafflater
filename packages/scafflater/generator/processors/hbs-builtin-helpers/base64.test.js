import base64Helper from "./base64";
import Handlebars from "handlebars";

test("Handlebars call", () => {
  Handlebars.registerHelper("base64", base64Helper);
  expect(
    Handlebars.compile('{{base64 "warning456" }}', {
      noEscape: true,
    })({})
  ).toBe("d2FybmluZzQ1Ng==");
});

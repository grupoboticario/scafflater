import echoHelper from "./echo";
import Handlebars from "handlebars";

test("Handlebars call", () => {
  Handlebars.registerHelper("echo", echoHelper);
  expect(
    Handlebars.compile('{{echo "testing" }}', {
      noEscape: true,
    })({}),
  ).toBe("testing");
});

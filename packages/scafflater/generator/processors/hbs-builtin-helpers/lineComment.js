import { buildLineComment } from "../../../util/index.js";

export default function lineComment(context, options) {
  return buildLineComment(options.data.root.options, options.fn(context));
}

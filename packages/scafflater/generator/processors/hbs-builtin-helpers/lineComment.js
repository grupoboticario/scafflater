import { buildLineComment } from "../../../util";

export default function lineComment(context, options) {
  return buildLineComment(options.data.root.options, options.fn(context));
}

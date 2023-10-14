import { buildLineComment } from "../../../util/index.js";

/**
 * @param context
 * @param options
 */
export default function lineComment(context, options) {
  return buildLineComment(options.data.root.options, options.fn(context));
}

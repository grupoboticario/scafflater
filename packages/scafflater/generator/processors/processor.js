/**
 * @typedef {object} ProcessResult
 * @property {object} context The context of generation. The processor can change context output to next steps.
 * @property {string} result The result string of process.
 */

class Processor {
  /**
   * Process the input.
   *
   * @param {object} context The context of generation
   * @param {string} input The string to be processed
   * @returns {ProcessResult} The process result
   */
  process(context, input) {
    return {
      context,
      result: input,
    };
  }

  /**
   * Applies a processors pipeline to a content, given an specific context.
   *
   * @param {Array<Processor>} processors - Processors to be executed
   * @param {object} context The context of generation
   * @param {string} input The string to be processed
   * @returns {string} The pipeline process result
   */
  static runProcessorsPipeline(processors, context, input) {
    let generationContext = { ...context };

    for (const processor of processors) {
      const processorResult = processor.process(generationContext, input);
      generationContext = processorResult.context;
      input = processorResult.result.trim();
    }

    return input;
  }
}

module.exports = Processor;

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
   * @returns {Promise<ProcessResult>} The process result
   */
  async process(context, input) {
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
   * @returns {Promise<string>} The pipeline process result
   */
  static async runProcessorsPipeline(processors, context, input) {
    let generationContext = { ...context };

    for (const processor of processors) {
      const processorResult = await processor.process(generationContext, input);
      generationContext = processorResult.context;
      input = processorResult.result;
    }

    return Promise.resolve(input);
  }
}

module.exports = Processor;

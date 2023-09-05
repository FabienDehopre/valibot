import type { ObjectSchema } from '../../schemas/object/index.ts';
import { getIssues } from '../../utils/index.ts';

/**
 * Creates a strict object schema that throws an error if an input contains
 * unknown keys.
 *
 * @param schema A object schema.
 * @param error The error message.
 *
 * @returns A strict object schema.
 */
export function strict<TSchema extends ObjectSchema<any>>(
  schema: TSchema,
  error?: string
): TSchema {
  return {
    ...schema,

    /**
     * Parses unknown input based on its schema.
     *
     * @param input The input to be parsed.
     * @param info The parse info.
     *
     * @returns The parsed output.
     */
    _parse(input, info) {
      const result = schema._parse(input, info);
      if (result.issues) {
        return result;
      }

      const schemaKeys = Object.keys(schema.object);
      const outputKeys = Object.keys(result.output);
      const extraKeys = outputKeys.filter((k) => !schemaKeys.includes(k));
      if (extraKeys.length > 0) {
        return getIssues(
          info,
          'object',
          'strict',
          error || `Invalid keys: ${extraKeys.join(', ')}`,
          input
        );
      }

      return result;
    },
  };
}

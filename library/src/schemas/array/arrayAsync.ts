import type {
  BaseSchema,
  BaseSchemaAsync,
  Input,
  Issues,
  Output,
  PipeAsync,
} from '../../types.ts';
import {
  executePipeAsync,
  getDefaultArgs,
  getIssues,
} from '../../utils/index.ts';
import type { ArrayPathItem } from './types.ts';

/**
 * Array schema async type.
 */
export type ArraySchemaAsync<
  TArrayItem extends BaseSchema | BaseSchemaAsync,
  TOutput = Output<TArrayItem>[]
> = BaseSchemaAsync<Input<TArrayItem>[], TOutput> & {
  schema: 'array';
  array: { item: TArrayItem };
};

/**
 * Creates an async array schema.
 *
 * @param item The item schema.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async array schema.
 */
export function arrayAsync<TArrayItem extends BaseSchema | BaseSchemaAsync>(
  item: TArrayItem,
  pipe?: PipeAsync<Output<TArrayItem>[]>
): ArraySchemaAsync<TArrayItem>;

/**
 * Creates an async array schema.
 *
 * @param item The item schema.
 * @param error The error message.
 * @param pipe A validation and transformation pipe.
 *
 * @returns An async array schema.
 */
export function arrayAsync<TArrayItem extends BaseSchema | BaseSchemaAsync>(
  item: TArrayItem,
  error?: string,
  pipe?: PipeAsync<Output<TArrayItem>[]>
): ArraySchemaAsync<TArrayItem>;

export function arrayAsync<TArrayItem extends BaseSchema | BaseSchemaAsync>(
  item: TArrayItem,
  arg2?: string | PipeAsync<Output<TArrayItem>[]>,
  arg3?: PipeAsync<Output<TArrayItem>[]>
): ArraySchemaAsync<TArrayItem> {
  // Get error and pipe argument
  const [error, pipe] = getDefaultArgs(arg2, arg3);

  // Create and return async array schema
  return {
    /**
     * The schema type.
     */
    schema: 'array',

    /**
     * The array item schema.
     */
    array: { item },

    /**
     * Whether it's async.
     */
    async: true,

    /**
     * Parses unknown input based on its schema.
     *
     * @param input The input to be parsed.
     * @param info The parse info.
     *
     * @returns The parsed output.
     */
    async _parse(input, info) {
      // Check type of input
      if (!Array.isArray(input)) {
        return getIssues(info, 'type', 'array', error || 'Invalid type', input);
      }

      // Create issues and output
      let issues: Issues | undefined;
      const output: any[] = [];

      // Parse schema of each array item
      await Promise.all(
        input.map(async (value, key) => {
          // If not aborted early, continue execution
          if (!(info?.abortEarly && issues)) {
            // Parse schema of array item
            const result = await item._parse(value, info);

            // If not aborted early, continue execution
            if (!(info?.abortEarly && issues)) {
              // If there are issues, capture them
              if (result.issues) {
                // Create array path item
                const pathItem: ArrayPathItem = {
                  schema: 'array',
                  input,
                  key,
                  value,
                };

                // Add modified result issues to issues
                for (const issue of result.issues) {
                  if (issue.path) {
                    issue.path.unshift(pathItem);
                  } else {
                    issue.path = [pathItem];
                  }
                  issues?.push(issue);
                }
                if (!issues) {
                  issues = result.issues;
                }

                // If necessary, abort early
                if (info?.abortEarly) {
                  throw null;
                }

                // Otherwise, add item to array
              } else {
                output[key] = result.output;
              }
            }
          }
        })
      ).catch(() => null);

      // Return issues or pipe result
      return issues
        ? { issues }
        : executePipeAsync(output as Output<TArrayItem>[], pipe, info, 'array');
    },
  };
}

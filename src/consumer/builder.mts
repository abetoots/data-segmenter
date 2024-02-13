/**
 * This file contains the API for building segments.
 * It's the first step in the process of building a query. It represents the
 * possible segments that can be built from your data and is the source of truth.
 * You'll most likely be sharing the definitions created here with your frontend.
 *
 */

export type SegmentDefinition<TName extends string> = {
  name: TName;
  description?: string;
  /**
   * Return a query that represents this segment.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildQuery: (...args: any[]) => any; // replace `any` with your specific query builder type
};

export function createSegmentDefinitions<T extends readonly SegmentDefinition<V>[], V extends string>(args: T) {
  return args;
}

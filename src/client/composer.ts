import { BaseSegment, ComposedSegment } from '../segment-types';

/**
 * Creates a function that can be used to create a "composed" segment.
 */
export const createClientComposer = <TSegment extends BaseSegment, TOperator extends string = string>() => {
  const composer = (
    operator: TOperator,
    segments: (ComposedSegment<TSegment, TOperator> | TSegment)[],
  ): ComposedSegment<TSegment, TOperator> => {
    return { type: 'composed', options: { operator, segments } };
  };
  return composer;
};

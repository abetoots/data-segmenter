/* eslint-disable @typescript-eslint/no-explicit-any */

import { BaseSegment, ComposedSegment } from '../segment-types';
import { createSegmentDefinitions } from './builder';

/**
 * A parser for a composed segment.
 *
 * @param composedSegment A composed segment built from the SegmentComposer
 * @param definitions Segment definitions
 */
export const parse = <TQueryType, TSegmentTypes extends BaseSegment = BaseSegment>(options: {
  composedSegment: ComposedSegment<TSegmentTypes>;
  definitions: ReturnType<typeof createSegmentDefinitions>;
  onHandleNegate?: (segment: TSegmentTypes, query: TQueryType) => TQueryType;
  onHandleSegmentWithoutDefinition?: (segment: TSegmentTypes) => TQueryType;
  onHandleComposedSegmentOperator?: (queries: TQueryType[], operator: string) => TQueryType;
}) => {
  //get the built queries of the default segments at this level
  const queries: TQueryType[] = [];
  //the parsed query to return
  let parsed: TQueryType | undefined;
  for (const segment of options.composedSegment.options.segments) {
    if (segment.type === 'composed') {
      //recurse
      queries.push(parse(options));
    } else {
      const s = segment as TSegmentTypes;

      //if the segment has a definition key, use it to build the query
      if (segment.definitionKey) {
        const segmentDefinition = options.definitions.find((def) => def.name === s.definitionKey);
        if (!segmentDefinition) {
          continue;
        }
        let query = segmentDefinition.buildQuery(s);

        if (segment.negate) {
          query = options.onHandleNegate?.(s, query) ?? query;
        }

        queries.push(query);
      } else {
        if (options.onHandleSegmentWithoutDefinition) {
          //if the segment has no definition key, use the onHandleSegmentWithoutDefinition
          queries.push(options.onHandleSegmentWithoutDefinition(s));
        }
      }
    }
  }

  const operator = options.composedSegment.options.operator;

  if (options.onHandleComposedSegmentOperator) {
    parsed = options.onHandleComposedSegmentOperator(queries, operator);
  }

  if (!parsed) {
    throw new Error('No parsed query');
  }

  return parsed;
};

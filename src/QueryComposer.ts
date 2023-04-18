import type { ComposedSegment, TimePeriodOperator } from './SegmentComposer.js';
import type { SegmentBuilder } from './SegmentBuilder.js';

type QueryComposerOptions<QueryType> = {
  /**
   * Negate the given query.
   */
  negateQuery: (field: string, value: any) => QueryType;
  /**
   * Construct a time query
   */
  composeTimePeriodQuery: (field: string, value: Date, operator: TimePeriodOperator) => QueryType;
  /**
   * Merge the two queries. This is different from composing AND queries.
   */
  combineQueries: (queries: QueryType[]) => QueryType;
  /**
   * Combine the queries with an AND operator.
   */
  composeAndQuery: (queries: QueryType[]) => QueryType;
  /**
   * Combine the queries with an OR operator.
   */
  composeOrQuery: (queries: QueryType[]) => QueryType;
  /**
   * Combine the queries with an OR operator.
   */
  composeNotQuery: (queries: QueryType[]) => QueryType;
};

export class QueryComposer<TQueryType> {
  negateQuery!: QueryComposerOptions<TQueryType>['negateQuery'];
  combineQueries!: QueryComposerOptions<TQueryType>['combineQueries'];
  composeAndQuery!: QueryComposerOptions<TQueryType>['composeAndQuery'];
  composeOrQuery!: QueryComposerOptions<TQueryType>['composeOrQuery'];
  composeNotQuery!: QueryComposerOptions<TQueryType>['composeNotQuery'];
  composeTimePeriodQuery!: QueryComposerOptions<TQueryType>['composeTimePeriodQuery'];

  constructor(options: QueryComposerOptions<TQueryType>) {
    this.negateQuery = options.negateQuery;
    this.composeOrQuery = options.combineQueries;
    this.composeAndQuery = options.composeAndQuery;
    this.composeOrQuery = options.composeOrQuery;
    this.composeNotQuery = options.composeNotQuery;
    this.composeTimePeriodQuery = options.composeTimePeriodQuery;
  }
}

export default QueryComposer;

/**
 * Parses a composed segment and builds the composed queries using your QueryComposer
 * and SegmentBuilder. These two instances should use the same TQuery and TData to ensure
 * consistent queries.
 *
 * @param composedSegment A composed segment built from the SegmentComposer
 * @param composer SegmentComposer instance
 * @param segmentBuilder SegmentBuilder Instance
 */
export const parse = <TQuery, TData>(
  composedSegment: ComposedSegment<unknown, unknown>,
  composer: QueryComposer<TQuery>,
  segmentBuilder: SegmentBuilder<TQuery, TData>,
) => {
  //get the built queries of the default segments at this level
  const queries: TQuery[] = [];
  //the parsed query to return
  let parsed: TQuery | undefined;
  for (const segment of composedSegment.segments) {
    if (segment.type === 'composed') {
      //recurse
      queries.push(parse(segment, composer, segmentBuilder));
    }
    if (segment.type === 'default') {
      let query = segmentBuilder.getSegmentQuery(segment.name, segment.value);
      if (segment.negate) {
        query = composer.negateQuery(segment.name, segment.value);
      }

      queries.push(query);
    }

    if (segment.type === 'timeperiod') {
      queries.push(composer.composeTimePeriodQuery(segment.field, segment.value, segment.operator));
    }
  }

  if (composedSegment.operator === 'AND') {
    parsed = composer.composeAndQuery(queries);
  }

  if (composedSegment.operator === 'OR') {
    parsed = composer.composeOrQuery(queries);
  }

  if (composedSegment.operator === 'NOT') {
    parsed = composer.composeNotQuery(queries);
  }

  if (!parsed) {
    throw new Error('No parsed query');
  }

  return parsed;
};

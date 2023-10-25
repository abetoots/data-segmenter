import type { ComposedSegment, TimePeriodOperator } from './SegmentComposer.js';
import { SegmentDefinitions, SegmentOptionValue, SegmentQuery, getSegment } from './SegmentBuilder.js';

type QueryComposerOptions<QueryType, TimePeriodFields extends string, TimePeriodValues extends string> = {
  /**
   * Negate the given query.
   */
  negateQuery: (args: { field: string; value: SegmentOptionValue['value'] }) => SegmentQuery<QueryType>;
  /**
   * Construct a time period query
   */
  composeTimePeriodQuery: (args: {
    field: TimePeriodFields;
    value: TimePeriodValues;
    operator: TimePeriodOperator;
    negate?: boolean;
  }) => SegmentQuery<QueryType>;
  /**
   * Construct a time period query
   */
  composeTimeRangeQuery: (args: { field: TimePeriodFields; start: TimePeriodValues; end: string }) => QueryType;
  /**
   * Merge the two queries. This is different from composing AND queries.
   */
  combineQueries?: (queries: QueryType[]) => SegmentQuery<QueryType>;
  /**
   * Combine the queries with an AND operator.
   */
  composeAndQuery: (queries: QueryType[]) => SegmentQuery<QueryType>;
  /**
   * Combine the queries with an OR operator.
   */
  composeOrQuery: (queries: QueryType[]) => SegmentQuery<QueryType>;
  /**
   * Combine the queries with an OR operator.
   */
  composeNotQuery: (queries: QueryType[]) => SegmentQuery<QueryType>;
};

export class QueryComposer<TQueryType, TTimePeriodFields extends string, TTimePeriodValues extends string> {
  negateQuery!: QueryComposerOptions<TQueryType, TTimePeriodFields, TTimePeriodValues>['negateQuery'];
  combineQueries: QueryComposerOptions<TQueryType, TTimePeriodFields, TTimePeriodValues>['combineQueries'];
  composeAndQuery!: QueryComposerOptions<TQueryType, TTimePeriodFields, TTimePeriodValues>['composeAndQuery'];
  composeOrQuery!: QueryComposerOptions<TQueryType, TTimePeriodFields, TTimePeriodValues>['composeOrQuery'];
  composeNotQuery!: QueryComposerOptions<TQueryType, TTimePeriodFields, TTimePeriodValues>['composeNotQuery'];
  composeTimePeriodQuery!: QueryComposerOptions<
    TQueryType,
    TTimePeriodFields,
    TTimePeriodValues
  >['composeTimePeriodQuery'];

  constructor(options: QueryComposerOptions<TQueryType, TTimePeriodFields, TTimePeriodValues>) {
    this.negateQuery = options.negateQuery;
    this.combineQueries = options.combineQueries;
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
 * @param definitions Segment definitions
 */
export const parse = <
  TQueryType,
  TSegmentNames extends string,
  TTimePeriodFields extends string,
  TTimePeriodValues extends string,
>(
  composedSegment: ComposedSegment<TSegmentNames, TTimePeriodFields, TTimePeriodValues>,
  composer: QueryComposer<TQueryType, TTimePeriodFields, TTimePeriodValues>,
  definitions: SegmentDefinitions,
) => {
  //get the built queries of the default segments at this level
  const queries: TQueryType[] = [];
  //the parsed query to return
  let parsed: TQueryType | undefined;
  for (const segment of composedSegment.segments) {
    if (segment.type === 'composed') {
      //recurse
      queries.push(parse(segment, composer, definitions));
    }
    if (segment.type === 'default') {
      let { query } = getSegment(segment.name, segment.value, definitions);
      if (segment.negate) {
        query = composer.negateQuery({ field: segment.name, value: segment.value }) as typeof query;
      }

      queries.push(query as TQueryType);
    }

    if (segment.type === 'timeperiod') {
      queries.push(
        composer.composeTimePeriodQuery({
          field: segment.field as TTimePeriodFields,
          operator: segment.operator,
          value: segment.value,
          negate: segment.negate,
        }),
      );
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

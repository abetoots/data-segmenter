export type CompositionOperator = 'AND' | 'OR' | 'NOT';

export type TimePeriodOperator = 'GT' | 'LT' | 'GTE' | 'LTE';

//To be sent to the backend and parsed by the QueryComposer
export type ComposedSegment<TSegmentNames, TTimePeriods> = {
  type: 'composed';
  operator: CompositionOperator;
  segments: (Segment<TSegmentNames> | ComposedSegment<TSegmentNames, TTimePeriods> | TimePeriodSegment<TTimePeriods>)[];
};

//https://stackoverflow.com/questions/45251664/derive-union-type-from-tuple-array-values
export type UnionOfArrayElements<T extends Readonly<unknown[]>> = T[number];

/**
 * Indicates we want to further filther the segment within a timeperiod
 * Takes in a type parameter of string[] which contains all the possible
 * timeperiod fields in the data source. We extract those into a union using UnionOfArrayElements.
 */
export type TimePeriodSegment<TTimePeriods> = {
  type: 'timeperiod';
  field: TTimePeriods extends readonly string[]
    ? UnionOfArrayElements<TTimePeriods>
    : TTimePeriods extends string
    ? TTimePeriods
    : string;
  value: Date;
  operator: TimePeriodOperator;
};

/**
 * Represents a segment definition in the backend. Takes in a type parameter of all
 * the possible segment names.  We extract those into a union using UnionOfArrayElements.
 */
export type Segment<TSegmentNames> = {
  type: 'default';
  name: TSegmentNames extends readonly string[]
    ? UnionOfArrayElements<TSegmentNames>
    : TSegmentNames extends string
    ? TSegmentNames
    : string;
  value: string | null;
  negate?: boolean;
};

type SegmentComposer<TSegmentNames, TTimePeriods> = (
  operator: CompositionOperator,
  segments: (Segment<TSegmentNames> | TimePeriodSegment<TTimePeriods> | ComposedSegment<TSegmentNames, TTimePeriods>)[],
) => ComposedSegment<TSegmentNames, TTimePeriods>;

export const createComposer = <TSegmentNames, TTimePeriods>(): SegmentComposer<TSegmentNames, TTimePeriods> => {
  const composer: SegmentComposer<TSegmentNames, TTimePeriods> = (
    operator: CompositionOperator,
    segments: (
      | Segment<TSegmentNames>
      | TimePeriodSegment<TTimePeriods>
      | ComposedSegment<TSegmentNames, TTimePeriods>
    )[],
  ) => {
    return { type: 'composed', operator, segments };
  };
  return composer;
};

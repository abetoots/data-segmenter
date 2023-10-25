import { z } from 'zod';

export type CompositionOperator = 'AND' | 'OR' | 'NOT';

export type TimePeriodOperator = 'GT' | 'LT' | 'GTE' | 'LTE';

//To be sent to the backend and parsed by the QueryComposer
export type ComposedSegment<TSegmentNames, TTimePeriodFields, TTimePeriodValues> = {
  type: 'composed';
  operator: CompositionOperator;
  segments: (
    | DefaultComposableSegment<TSegmentNames>
    | ComposedSegment<TSegmentNames, TTimePeriodFields, TTimePeriodValues>
    | TimePeriodComposableSegment<TTimePeriodFields, TTimePeriodValues>
    | TimeRangeComposableSegment<TTimePeriodFields, TTimePeriodValues>
  )[];
};

//https://stackoverflow.com/questions/45251664/derive-union-type-from-tuple-array-values
export type UnionOfArrayElements<T extends Readonly<unknown[]>> = T[number];

/**
 * Indicates we want to further filther the segment against a timeperiod
 * Takes in a type parameter of string[] which contains all the possible
 * timeperiod fields in the data source. We extract those into a union using UnionOfArrayElements.
 */
export type TimePeriodComposableSegment<TTimePeriodFields, TTimePeriodValues> = {
  type: 'timeperiod';
  field: TTimePeriodFields extends readonly string[]
    ? UnionOfArrayElements<TTimePeriodFields>
    : TTimePeriodFields extends string
    ? TTimePeriodFields
    : string;
  value: TTimePeriodValues;
  operator: TimePeriodOperator;
  negate?: boolean;
};

/**
 * Indicates we want to further filther the segment within a time range
 * Takes in a type parameter of string[] which contains all the possible
 * timeperiod fields in the data source. We extract those into a union using UnionOfArrayElements.
 */
export type TimeRangeComposableSegment<TTimePeriodFields, TTimePeriodValues> = {
  type: 'timerange';
  field: TTimePeriodFields extends readonly string[]
    ? UnionOfArrayElements<TTimePeriodFields>
    : TTimePeriodFields extends string
    ? TTimePeriodFields
    : string;
  start: TTimePeriodValues;
  end: TTimePeriodValues;
};

/**
 * Represents a segment definition in the backend. Takes in a type parameter of all
 * the possible segment names.  We extract those into a union using UnionOfArrayElements.
 */
export type DefaultComposableSegment<TSegmentNames> = {
  type: 'default';
  name: TSegmentNames extends readonly string[]
    ? UnionOfArrayElements<TSegmentNames>
    : TSegmentNames extends string
    ? TSegmentNames
    : string;
  value: string | number;
  negate?: boolean;
};

export type ComposableSegments<TSegmentNames, TTimePeriodFields, TTimePeriodValues> =
  | DefaultComposableSegment<TSegmentNames>
  | TimePeriodComposableSegment<TTimePeriodFields, TTimePeriodValues>
  | TimeRangeComposableSegment<TTimePeriodFields, TTimePeriodValues>
  | ComposedSegment<TSegmentNames, TTimePeriodFields, TTimePeriodValues>;

type SegmentComposer<TSegmentNames, TTimePeriodFields, TTimePeriodValues> = (
  operator: CompositionOperator,
  segments: ComposableSegments<TSegmentNames, TTimePeriodFields, TTimePeriodValues>[],
) => ComposedSegment<TSegmentNames, TTimePeriodFields, TTimePeriodValues>;

export const createComposer = <TSegmentNames, TTimePeriodFields, TTimePeriodValues>(): SegmentComposer<
  TSegmentNames,
  TTimePeriodFields,
  TTimePeriodValues
> => {
  const composer: SegmentComposer<TSegmentNames, TTimePeriodFields, TTimePeriodValues> = (
    operator: CompositionOperator,
    segments: ComposableSegments<TSegmentNames, TTimePeriodFields, TTimePeriodValues>[],
  ) => {
    return { type: 'composed', operator, segments };
  };
  return composer;
};

export const compositionOperatorSchema = z.union([z.literal('AND'), z.literal('OR'), z.literal('NOT')]);

export const timePeriodOperatorSchema = z.union([z.literal('GT'), z.literal('LT'), z.literal('GTE'), z.literal('LTE')]);

export const timeRangeComposableSegmentSchema = z.object({
  type: z.literal('timerange'),
  field: z.string(),
  start: z.string(),
  end: z.string(),
});

export const timePeriodComposableSegmentSchema = z.object({
  type: z.literal('timeperiod'),
  field: z.string(),
  value: z.string(),
  operator: timePeriodOperatorSchema,
  negate: z.boolean().optional(),
});

export const defaultComposableSegmentSchema = z.object({
  type: z.literal('default'),
  name: z.string(),
  value: z.union([z.string(), z.number()]),
  negate: z.boolean().optional(),
});

//Example schema
// const composedSegmentSchema: z.ZodSchema<ComposedSegment<>> = z.lazy(() =>
//   z.object({
//     type: z.literal('composed'),
//     operator: compositionOperatorSchema,
//     segments: z.array(
//       z.union([
//         defaultComposableSegmentSchema,
//         composedSegmentSchema,
//         timePeriodComposableSegmentSchema,
//         timeRangeComposableSegmentSchema,
//       ]),
//     ),
//   }),
// );

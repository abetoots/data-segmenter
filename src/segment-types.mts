/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnionOfArrayElements } from './utils.mjs';

export interface BaseSegment {
  type: string;
  /** Indicates this segment has a definition built by the SegmentBuilder. */
  definitionKey?: string;
  negate?: boolean;
  options?: Record<string, unknown>;
}

//Pre-made segment types

/**
 * The most basic segment. Represents a segment from your data that matches a value.
 */
export interface DefaultSegment<TDefinitionKey extends string = string> extends BaseSegment {
  type: 'default';
  definitionKey?: TDefinitionKey extends readonly string[]
    ? UnionOfArrayElements<TDefinitionKey>
    : TDefinitionKey extends string
    ? TDefinitionKey
    : string;
  value: any;
}

/**
 * Represents a segment from your data that matches a  fixed time period i.e.
 * {REFERENCE_DATE} is a fixed date.
 *
 * If it were expressed in words, it would be something like:
 *
 * "All data with {FIELD} {START} {UNIT} {OPERATOR} {REFERENCE_DATE}."
 *
 * Ex: All data with "created_at" "7" "days" "before" "2021-01-01T00:00:00Z".
 */

export interface FixedTimePeriodSegment<TTimeFields extends string = string, TDefinitionKey extends string = string>
  extends BaseSegment {
  type: 'fixed_timeperiod';
  definitionKey?: TDefinitionKey extends readonly string[]
    ? UnionOfArrayElements<TDefinitionKey>
    : TDefinitionKey extends string
    ? TDefinitionKey
    : string;
  referenceDate: Date | string;
  options: {
    value: number;
    unit: string;
    field: TTimeFields;
    operator: string;
  };
}

/**
 * Represents a segment from your data that matches a time range with start and end is relative to
 * {REFERENCE_DATE}. {REFERENCE_DATE} can be a fixed date or a relative date.
 *
 * ### Use case #1: Fixed date
 *
 * "All data that has {FIELD} with range of between {START.VALUE} {START.UNIT} {START.OP} {VALUE} to {END.VALUE} {END.UNIT} {END.OP} {REFERENCE_DATE}"
 *
 * Ex: All data that has "reservation" with range of "1" "day" "after" "2021-01-01T00:00:00Z" to "7" "days" "after" "2021-01-01T00:00:00Z".
 *
 * ```js
 *    const timeRange = {
 *      type: "time_range",
 *      value: "2021-01-01T00:00:00Z",
 *      options: {
 *          start: { value: 1, unit: "day", operator_relative_to_value: "after" },
 *          end: { value: 7, unit: "day", operator_relative_to_value: "after" },
 *          field: "reservation",
 *          },
 *      };
 * ```
 *
 * ### Use case #2: Rolling dates / Relative dates
 *
 * "All data that has {FIELD} with range of between {START.VALUE} {START.UNIT} {START.OP} {VALUE} to {END.VALUE} {END.UNIT} {END.OP} {REFERENCE_DATE}"
 *
 * #### NOTE: Use 0 for {START.VALUE} or {END.VALUE} to use the provided {REFERENCE_DATE} as the start or end.
 *
 * Ex: All data that has "event_date" from now till 7 days in the future.
 *
 * ```js
 *    const relativeTimeRange = {
 *      type: "time_range",
 *      referenceDate: "now",
 *      options: {
 *          start: { value: 0,  },
 *          end: { value: 7, unit: "day", operatorRelativeToReference: "after" },
 *          field: "event_date",
 *          },
 *      };
 * ```
 *
 * Ex: All data that has "event_date" from now till 7 days ago.
 *
 * ```js
 *    const relativeTimeRange = {
 *      type: "time_range",
 *      referenceDate: "now",
 *      options: {
 *          start: { value: 7, unit: 'day', operatorRelativeToReference: "before" },
 *          end: { value: 0 },
 *          field: "event_date",
 *          },
 *      };
 * ```
 *
 */
export interface TimeRangeSegment<TDefinitionKey extends string = string> extends BaseSegment {
  type: 'time_range';
  definitionKey?: TDefinitionKey extends readonly string[]
    ? UnionOfArrayElements<TDefinitionKey>
    : TDefinitionKey extends string
    ? TDefinitionKey
    : string;
  referenceDate: Date | string;
  options: {
    start: {
      value: number;
      unit?: string;
      operatorRelativeToReference?: string;
    };
    end: {
      value: number;
      unit?: string;
      operatorRelativeToReference?: string;
    };
    field: string;
  };
}

/**
 * Represents a composed or combined segments to be treated as a single segment.
 * Use this to combine segments with AND, OR, NOT operators.
 */
export interface ComposedSegment<TSegment extends BaseSegment, TCompositionOperator extends string = string>
  extends BaseSegment {
  type: 'composed';
  options: {
    operator: TCompositionOperator;
    segments: (ComposedSegment<TSegment, TCompositionOperator> | TSegment)[];
  };
}

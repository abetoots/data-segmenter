import { createSegmentDefinitions } from '../src/consumer/builder';
import { createClientComposer } from '../src/client/composer';

import type { DefaultSegment, FixedTimePeriodSegment, TimeRangeSegment } from '../src/segment-types';
import { parse } from '../src/consumer/parser';

type MongoDBQuery = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

//STEP 1: Define your segments.
export const growthSegmentDefinitions = createSegmentDefinitions([
  {
    name: 'originalSource',
    description: 'Segment by originalSource of profiles.',
    buildQuery: (value) => {
      return { originalSource: value as string } as const;
    },
  },
  {
    name: 'customerOrProspect',
    description: 'Get all profiles based on whether they had transactions or not',
    buildQuery: (value) => {
      if (value === 'customer') {
        return {
          totalTransactions: { $gt: 0 } as const,
        };
      }
      return {
        totalTransactions: { $eq: 0 } as const,
      };
    },
  },
]);

type SegmentsWeHandle = DefaultSegment | FixedTimePeriodSegment | TimeRangeSegment;

//STEP 2: Compose segments in the client.
//Create a composer with all the possible segment names and time period fields.
const segmentComposer = createClientComposer<SegmentsWeHandle>();

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

//How you resolve this in the backend is up to you
const composedSegment = segmentComposer('AND', [
  { type: 'default', definitionKey: 'originalSource', value: 'Google' },
  //get all with field "lastUpdated" from now to 7 days in the future
  {
    type: 'time_range',
    referenceDate: 'now',
    options: {
      field: 'lastUpdated',
      start: { value: 0 },
      end: { value: 7, unit: 'day', operatorRelativeToReference: 'after' },
    },
  },
  //get all with field "event_date" anywhere from 7 days before to 4 days after the specified date/value
  {
    type: 'time_range',
    referenceDate: '2021-01-01T00:00:00Z',
    options: {
      field: 'event_date',
      start: {
        value: 7,
        unit: 'day',
        operatorRelativeToReference: 'before',
      },
      end: {
        value: 4,
        unit: 'day',
        operatorRelativeToReference: 'after',
      },
    },
  },
  //get all with field "timestamp" 7 days before the specified date/value
  {
    type: 'fixed_timeperiod',
    referenceDate: '2021-01-01T00:00:00Z',
    options: { field: 'timestamp', operator: 'less than', value: 7, unit: 'day' },
  },
  //a composed segment treated as a single segment
  //get all profiles that are customers AND have originalSource as Google AND were updated in the last 7 days
  {
    type: 'composed',
    options: {
      operator: 'AND',
      segments: [
        { type: 'default', definitionKey: 'originalSource', value: 'Google' },
        { type: 'default', definitionKey: 'customerOrProspect', value: 'customer' },
        {
          type: 'time_range',
          referenceDate: 'now',
          options: {
            field: 'lastUpdated',
            start: { value: 7, unit: 'day', operatorRelativeToReference: 'after' },
            end: { value: 0 },
          },
        },
      ],
    },
  },
]);

//STEP 3: Parse composed and segments and build composed queries in the backend.

console.dir(
  parse<MongoDBQuery, SegmentsWeHandle>({
    composedSegment,
    definitions: growthSegmentDefinitions,
    onHandleNegate: (segment, query) => {
      if (segment.type === 'default' && segment.definitionKey) {
        return { [segment.definitionKey]: { $ne: segment.value } };
      }
      return query;
    },
    onHandleComposedSegmentOperator: (queries, operator) => {
      if (operator === 'OR') {
        return { $or: queries };
      }

      if (operator === 'NOT') {
        return { $not: queries };
      }

      //By default, we combine all queries with AND
      return { $and: queries };
    },
  }),
  { depth: null },
);

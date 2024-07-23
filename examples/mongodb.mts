import { createSegmentDefinitions } from '../src/consumer/builder.mjs';
import { ClientComposer } from '../src/client/composer.mjs';

import type { DefaultSegment, FixedTimePeriodSegment, TimeRangeSegment } from '../src/segment-types.mjs';
import { Parser } from '../src/consumer/parser.mjs';

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

type FixedTimePeriodFilter = Omit<FixedTimePeriodSegment, 'definitionKey'>;

type TimeRangeFilter = Omit<TimeRangeSegment, 'definitionKey'>;

type FiltersWeHandle = FixedTimePeriodFilter | TimeRangeFilter;

//STEP 2: Compose segments in the client.
//Create a composer with all the possible segment names and time period fields.
const segmentComposer = new ClientComposer<SegmentsWeHandle, FiltersWeHandle>();

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

segmentComposer.addNewSegmentGroup({
  groupName: 'segmentGroup1',
  main: {
    segment: {
      type: 'default',
      definitionKey: 'originalSource',
      value: 'Google',
      negate: true,
    },
    relationToExtraSegments: 'AND',
  },
});

segmentComposer.addSegmentGroupExtraSegment('segmentGroup1', {
  type: 'default',
  definitionKey: 'customerOrProspect',
  value: 'customer',
});

//get all with field "lastUpdated" from now to 7 days in the future
segmentComposer.addSegmentGroupFilter('segmentGroup1', {
  type: 'time_range',
  referenceDate: 'now',
  options: {
    field: 'lastUpdated',
    start: { value: 0 },
    end: { value: 7, unit: 'day', operatorRelativeToReference: 'after' },
  },
});

//get all with field "event_date" anywhere from 7 days before to 4 days after the specified date/value
segmentComposer.addSegmentGroupFilter('segmentGroup1', {
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
});

//get all with field "timestamp" 7 days before the specified date/value
segmentComposer.addSegmentGroupFilter('segmentGroup1', {
  type: 'fixed_timeperiod',
  referenceDate: '2021-01-01T00:00:00Z',
  options: { field: 'timestamp', operator: 'less than', value: 7, unit: 'day' },
});

const segmentGroups = segmentComposer.getSegmentGroups();

//STEP 3: Parse composed and segments and build composed queries in the backend.

type ParsedSegmentGroup = {
  mainQuery: MongoDBQuery;
  extraQueries: MongoDBQuery[];
  filters: MongoDBQuery[];
};

const parser = new Parser<SegmentsWeHandle, FiltersWeHandle, ParsedSegmentGroup>({
  parseSegmentGroup: (_, groupOptions) => {
    let mainQuery: MongoDBQuery = {};
    const extraQueries: MongoDBQuery[] = [];
    const filters: MongoDBQuery[] = [];

    const mainDefinitionKey = groupOptions.main.segment.definitionKey;
    const mainDefinition = growthSegmentDefinitions.find((def) => def.name === mainDefinitionKey);
    if (mainDefinition && groupOptions.main.segment.type === 'default') {
      mainQuery = mainDefinition.buildQuery(groupOptions.main.segment.value);
      if (groupOptions.main.segment.negate) {
        //handle negate
        console.log('negating');
      }
    }

    for (const extraSegment of groupOptions.extraSegments) {
      const extraDefinitionKey = extraSegment.definitionKey;
      const extraDefinition = growthSegmentDefinitions.find((def) => def.name === extraDefinitionKey);
      if (extraDefinition && extraSegment.type === 'default') {
        extraQueries.push(extraDefinition.buildQuery(extraSegment.value));
        if (extraSegment.negate) {
          //handle negate
          console.log('negating');
        }
      }
    }

    for (const filter of groupOptions.filters) {
      //handle filters
      console.log('filter', filter);
    }

    return { mainQuery, extraQueries, filters };
  },
});

//Parse the segment groups

const finalQuery: MongoDBQuery[] = [];

for (const [groupName, groupOptions] of segmentGroups.entries()) {
  const { mainQuery, extraQueries, filters } = parser.parseSegmentGroup(groupName, groupOptions);
  console.log('mainQuery', mainQuery);
  console.log('extraQueries', extraQueries);
  console.log('filters', filters);

  if (groupOptions.main.relationToExtraSegments === 'AND') {
    finalQuery.push({ $and: [mainQuery, ...extraQueries, ...filters] });
  }
}

import { parse, QueryComposer } from '../src/QueryComposer.js';
import { createComposer } from '../src/SegmentComposer.js';
import { SegmentBuilder } from '../src/SegmentBuilder.js';
import type { TimePeriodOperator } from '../src/SegmentComposer.js';
import type { SegmentDefinition } from '../src/SegmentBuilder.js';

//STEP 1: Define your segments.

//this query type;
type MongoDBQuery = {
  [key: string]: any;
};

//What a segment should return when it's query is run
//against the data source.
type SegmentedData = {
  email: string;
  firstname: string;
  meta: any;
};

const segmentDefinitions: SegmentDefinition<MongoDBQuery, SegmentedData[]>[] = [
  {
    name: 'originalSource',
    description: 'Segment by originalSource of profiles.',
    buildQuery: (value) => {
      return { originalSource: value };
    },
    getSegmentOptions: async () => {
      // you should run a query here
      // to get all possible values of originalSource from your data
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve([{ value: 'google', count: 100 }]);
        }, 5000);
      });
    },
  },
  {
    name: 'withTransactions',
    description: 'Get all profiles that had transactions.',
    buildQuery: (params) => {
      return {
        totalTransactions: { $gt: 0 },
      };
    },
    getSegmentOptions() {
      // or provide arbitrary values
      return [{ value: 'With Transactions', count: null }];
    },
  },
];

// Create instance of segment builder
export const segmentBuilder = new SegmentBuilder(segmentDefinitions);

// Use segment builder to get a segment
const { name, query } = segmentBuilder.getSegment('originalSource', { value: 'Google' });

// Run and get the data
//db.profiles.findMany(query)

//STEP 2: Compose segments in the client.

//Assume the backend returns these data;
const fetchedTimePeriodsData = ['lastUpdated', 'timestamp'] as const; //declare as const

//or you can declare an arbitrary union
type PossibleFields = 'originalSource' | 'withTransactions';

//Create a composer with all the possible segment names and time period fields.
const segmentComposer = createComposer<PossibleFields, typeof fetchedTimePeriodsData>();

const composedSegment = segmentComposer('AND', [
  { type: 'default', name: 'originalSource', value: 'Google' },
  { type: 'default', name: 'withTransactions', value: null },
  {
    type: 'composed',
    operator: 'AND',
    segments: [
      { type: 'default', name: 'originalSource', value: 'Google' },
      { type: 'default', name: 'withTransactions', value: null },
    ],
  },
]);

const timeFilteredSegment = segmentComposer('AND', [
  composedSegment,
  { type: 'timeperiod', field: 'lastUpdated', value: new Date(), operator: 'LT' },
]);

//STEP 3: Parse composed and segments and build composed queries in the backend.

const myComposer = new QueryComposer<MongoDBQuery>({
  combineQueries: (queries) => queries.reduce((prevVal, currVal) => ({ ...prevVal, ...currVal }), {}),
  negateQuery: (field: string, value: any) => ({ [field]: { $ne: value } }),
  composeOrQuery: (queries) => ({ $or: queries }),
  composeAndQuery: (queries) => ({ $and: queries }),
  composeNotQuery: (queries) => ({ $not: queries }),
  composeTimePeriodQuery: (field: string, value: Date, operator: TimePeriodOperator) => {
    let op = '';
    switch (operator) {
      case 'GT':
        op = '$gt';
        break;
      case 'GTE':
        op = '$gte';
        break;
      case 'LT':
        op = '$lt';
        break;
      case 'LTE':
        op = '$lte';
        break;
      default:
        break;
    }
    return { [field]: { [op]: value } };
  },
});

console.dir(parse(timeFilteredSegment, myComposer, segmentBuilder), { depth: null });

import { parse, QueryComposer } from '../src/QueryComposer.js';
import { createComposer } from '../src/SegmentComposer.js';
import { createSegmentDefinitions, GetOptionsFn, getSegment } from '../src/SegmentBuilder.js';

type MongoDBQuery = {
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

type Keys = (typeof growthSegmentDefinitions)[number]['name'];

// Get a segment
const segment = getSegment('originalSource', 'Google', growthSegmentDefinitions);
console.log('sampleGetSegment', segment);

// Run and get the data
//db.profiles.findMany(query)

//Provide segment options to frontend
//Define data shape of response to frontend
const getOptions: GetOptionsFn<Keys> = () => {
  //Fetch data and resolve to data shape
  return {
    originalSource: [{ value: 'Google', count: 100 }], //found 100 profiles of originalSource = Google
    customerOrProspect: [
      { value: 'customer', count: 20 },
      { value: 'prospect', count: 45 },
    ],
  };
};
console.log('sampleOptions', getOptions());

//STEP 2: Compose segments in the client.

//Declare all possible segment options, time period fields, and time period values
type AllPossibleSegmentOptions = Keys;
type TimePeriodFields = 'lastUpdated' | 'timestamp';
type TimePeriodValues = '30daysfuture' | '7dayspast' | '7daysfuture' | '7days' | 'now';

//Create a composer with all the possible segment names and time period fields.
const segmentComposer = createComposer<AllPossibleSegmentOptions, TimePeriodFields, TimePeriodValues>();

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

//How you resolve this in the backend is up to you
const composedSegment = segmentComposer('AND', [
  { type: 'default', name: 'originalSource', value: 'Google' },
  { type: 'timerange', field: 'lastUpdated', start: 'now', end: '7daysfuture' }, //get all from now to 7 days in the future
  { type: 'timeperiod', field: 'timestamp', value: '7days', operator: 'GT' }, //get all from now to 7 days in the future
  {
    type: 'composed',
    operator: 'OR',
    segments: [
      { type: 'default', name: 'originalSource', value: 'Google' },
      { type: 'default', name: 'customerOrProspect', value: 'customer' },
      { type: 'timeperiod', field: 'lastUpdated', value: '7days', operator: 'LTE' }, //get all from past 7 days including today
    ],
  },
]);

const timeFilteredSegment = segmentComposer('AND', [
  composedSegment,
  { type: 'timerange', field: 'lastUpdated', start: 'now', end: '30daysfuture' }, //getall 30 days from now
]);

//STEP 3: Parse composed and segments and build composed queries in the backend.

const myComposer = new QueryComposer<MongoDBQuery, TimePeriodFields, TimePeriodValues>({
  combineQueries: (queries) => queries.reduce((prevVal, currVal) => ({ ...prevVal, ...currVal }), {}),
  negateQuery: (field, value) => ({ [field]: { $ne: value } }),
  composeOrQuery: (queries) => ({ $or: queries }),
  composeAndQuery: (queries) => ({ $and: queries }),
  composeNotQuery: (queries) => ({ $not: queries }),
  composeTimePeriodQuery: (field, value, operator) => {
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
  composeTimeRangeQuery: (field, start, end) => {
    //up to you how to resolve fields
    return { [field]: { $gte: start, $lte: end } };
  },
});

console.dir(
  parse<MongoDBQuery, AllPossibleSegmentOptions, TimePeriodFields, TimePeriodValues>(
    timeFilteredSegment,
    myComposer,
    growthSegmentDefinitions,
  ),
  { depth: null },
);

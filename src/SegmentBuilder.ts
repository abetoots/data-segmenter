//Represents all possible values of the segment
type SegmentOption = {
  value: unknown;
  count: number | null;
};

export type SegmentDefinition<QueryType, SegmentData> = {
  name: string;
  description?: string;
  /**
   * Return a query that represents this segment.
   */
  buildQuery: (params: SegmentOption['value']) => QueryType; // replace `any` with your specific query builder type
  /**
   * Get all possible values of the segment. Client consumers
   * would need this when trying to build out a UI
   * for composing segments.
   */
  getSegmentOptions: () => SegmentOption[];
  /**
   * Get the segmented data when the query is run against the data source.
   */
  getSegmentData?: (query: QueryType) => SegmentData;
};

type SegmentBuilderOptions<QueryType, SegmentData> = {
  executeSegment: (builtQuery: QueryType) => SegmentData;
};

export class SegmentBuilder<TQueryType, TSegmentData> {
  private segmentDefinitions: SegmentDefinition<TQueryType, TSegmentData>[] = [];
  private segments: { [name: string]: SegmentDefinition<TQueryType, TSegmentData> } = {};
  private options: SegmentBuilderOptions<TQueryType, TSegmentData>;

  constructor(
    segmentDefinitions: SegmentDefinition<TQueryType, TSegmentData>[],
    options: SegmentBuilderOptions<TQueryType, TSegmentData>,
  ) {
    this.segmentDefinitions = segmentDefinitions;
    this.options = options;

    for (const def of segmentDefinitions) {
      this.segments[def['name']] = def;
    }
  }

  executeSegment(name: string, builtQuery: TQueryType) {
    const segmentDefinition = this.segments[name];
    if (!segmentDefinition) {
      throw new Error(`Segment definition not found for segment: ${name}`);
    }
    if (segmentDefinition.getSegmentData) {
      return segmentDefinition.getSegmentData(builtQuery);
    }
    return this.options.executeSegment(builtQuery);
  }

  addSegment(segmentDefinition: SegmentDefinition<TQueryType, TSegmentData>) {
    this.segmentDefinitions.push(segmentDefinition);
    this.segments[segmentDefinition['name']] = segmentDefinition;
  }

  getSegmentDefinitions() {
    return this.segmentDefinitions;
  }

  getSegments() {
    return this.segments;
  }

  getSegmentQuery(name: string, params: SegmentOption['value']) {
    const segmentDefinition = this.segments[name];

    if (!segmentDefinition) {
      throw new Error(`Segment definition not found for segment: ${name}`);
    }

    return segmentDefinition.buildQuery(params);
  }

  getSegment(name: string, params: SegmentOption['value']) {
    const segmentDefinition = this.segmentDefinitions.find((def) => def.name === name);
    if (!segmentDefinition) {
      throw new Error(`Segment definition not found for segment: ${name}`);
    }
    const query = segmentDefinition.buildQuery(params);
    return { name: segmentDefinition.name, query };
  }
}

export default SegmentBuilder;

import { BaseSegment } from '../segment-types.mjs';

export type SegmentsGroupOptions<TSegment extends BaseSegment, TFilter, TRelation extends string = string> = {
  filters: TFilter[];
  main: {
    relationToExtraSegments: TRelation;
    segment: TSegment;
  };
  extraSegments: TSegment[];
  id: string;
};

export type CombinedSegmentsGroupOptions = {
  main: {
    id: string;
    relationToNextGroup: string;
  };
  extraGroupIds: {
    id: string;
    relationToNextGroup: string;
  }[];
  intent: string;
  options: Record<string, unknown>;
};

/**
 * Represents a client composer that manages segment groups and combines them.
 *
 * @template TSegment - The type of the main segment.
 * @template TFilter - The type of the filters.
 */
export class ClientComposer<TSegment extends BaseSegment, TFilter> {
  segmentGroupsMap: Map<string, SegmentsGroupOptions<TSegment, TFilter>>;

  combinedSegmentOptions: CombinedSegmentsGroupOptions = {
    main: {
      id: '',
      relationToNextGroup: '',
    },
    extraGroupIds: [],
    intent: '',
    options: {},
  };

  constructor() {
    this.segmentGroupsMap = new Map();
  }

  /**
   * Retrieves the segment group with the specified group name.
   *
   * @param groupName - The name of the segment group.
   * @returns The segment group object if found, otherwise undefined.
   */
  getSegmentGroup(groupName: string) {
    return this.segmentGroupsMap.get(groupName);
  }

  /**
   * Retrieves the segment groups.
   *
   * @returns The segment groups map.
   */
  getSegmentGroups() {
    return this.segmentGroupsMap;
  }

  /**
   * Adds a new segment group with the specified group name, main segment, and filters.
   *
   * @param groupName - The name of the segment group.
   * @param mainSegment - The main segment object.
   * @param filters - An array of filters.
   */
  addNewSegmentGroup({
    groupName,
    main,
    filters,
  }: {
    groupName: string;
    main: SegmentsGroupOptions<TSegment, TFilter>['main'];
    filters?: TFilter[];
  }) {
    //if the group already exists, return
    if (this.segmentGroupsMap.has(groupName)) {
      return;
    }
    this.segmentGroupsMap.set(groupName, {
      id: groupName,
      filters: filters ?? [],
      main,
      extraSegments: [],
    });
  }

  /**
   * Adds a filter to the specified segment group.
   *
   * @param groupName - The name of the segment group.
   * @param filter - The filter to add.
   */
  addSegmentGroupFilter(groupName: string, filter: TFilter) {
    const segmentGroup = this.segmentGroupsMap.get(groupName);
    if (segmentGroup) {
      segmentGroup.filters.push(filter);
    }
  }

  /**
   * Adds an extra segment to the specified segment group.
   *
   * @param groupName - The name of the segment group.
   * @param segment - The extra segment to add.
   */
  addSegmentGroupExtraSegment(groupName: string, segment: TSegment) {
    const segmentGroup = this.segmentGroupsMap.get(groupName);
    if (segmentGroup) {
      segmentGroup.extraSegments.push(segment);
    }
  }

  /**
   * Combines segment groups based on the provided options.
   * @param options - The options for combining segment groups.
   */
  combineSegmentGroups(options: CombinedSegmentsGroupOptions) {
    this.combinedSegmentOptions = options;
  }

  /**
   * Retrieves the combined segment options.
   *
   * @returns An array of combined segment options.
   */
  getCombinedGroups() {
    return this.combinedSegmentOptions;
  }
}

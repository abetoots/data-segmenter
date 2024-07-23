import { BaseSegment } from '../segment-types.mjs';

export type SegmentsGroupOptions<TSegment extends BaseSegment, TFilter, TRelation extends string = string> = {
  filters: TFilter[];
  main: {
    relationToExtraSegments: TRelation;
    segment: TSegment;
  };
  extraSegments: TSegment[];
};

export type CombinedSegmentsGroupOptions = {
  mainGroupId: string;
  extraGroupIds: string[];
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

  combinedSegmentGroupsMap: Map<string, CombinedSegmentsGroupOptions>;

  constructor() {
    this.segmentGroupsMap = new Map();
    this.combinedSegmentGroupsMap = new Map();
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
   * Combines the specified segment groups into a new combined group.
   *
   * @param mainGroupId - The ID of the main group.
   * @param extraGroupIds - An array of IDs of the extra groups.
   * @param intent - The intent of the combined group.
   * @param options - Additional options for the combined group.
   */
  combineSegmentGroups(mainGroupId: string, extraGroupIds: string[], intent: string, options: Record<string, unknown>) {
    this.combinedSegmentGroupsMap.set(mainGroupId, { mainGroupId, extraGroupIds, intent, options });
  }

  /**
   * Retrieves the combined groups map.
   *
   * @returns The combined groups map.
   */
  getCombinedGroups() {
    return this.combinedSegmentGroupsMap;
  }
}

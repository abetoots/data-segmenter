//Represents all possible values of the segment
export type SegmentOptionValue = {
  value: string | number;
  count: number | null;
};

type BuildQuery<TBuildQueryReturn> = (value: SegmentOptionValue['value']) => Readonly<TBuildQueryReturn>;

export type SegmentDefinition<TName extends string, TBuildQueryReturn> = {
  name: TName;
  description?: string;
  /**
   * Return a query that represents this segment.
   */
  buildQuery: BuildQuery<TBuildQueryReturn>; // replace `any` with your specific query builder type
};

export type SegmentDefinitions = ReturnType<typeof createSegmentDefinitions>;
export type SegmentQuery<TBuildQueryReturn> = ReturnType<BuildQuery<TBuildQueryReturn>>;

export function createSegmentDefinitions<T extends readonly SegmentDefinition<V, K>[], V extends string, K>(args: T) {
  return args;
}

export const getSegment = <TDefinitions extends SegmentDefinitions, TName extends TDefinitions[number]['name']>(
  name: TName,
  value: SegmentOptionValue['value'],
  definitions: TDefinitions,
) => {
  const segmentDefinition = definitions.find((def) => def.name === name);
  if (!segmentDefinition) {
    throw new Error(`Segment definition not found for segment: ${name}`);
  }

  type Definition = TDefinitions[number];
  type QueryOfThisName = ReturnType<Extract<Definition, { name: TName }>['buildQuery']>;
  const query = segmentDefinition.buildQuery(value) as QueryOfThisName;
  const segmentName = segmentDefinition.name as TName;
  return { name: segmentName, query };
};

export type SegmentOptions<TKeys extends string> = {
  [key in TKeys]: SegmentOptionValue[];
};

export type GetOptionsFn<TDefinitionKeys extends string> = (
  ...params: any[]
) => { [key in TDefinitionKeys]: SegmentOptionValue[] } | Promise<{ [key in TDefinitionKeys]: SegmentOptionValue[] }>;

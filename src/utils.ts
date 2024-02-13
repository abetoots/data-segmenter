//https://stackoverflow.com/questions/45251664/derive-union-type-from-tuple-array-values
export type UnionOfArrayElements<T extends Readonly<unknown[]>> = T[number];

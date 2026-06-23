export type VectorCrushOptions = {
  removeComments?: boolean;
  removeMetadata?: boolean;
  precision?: number;
};

export type PassReport = {
  name: string;
  changed: boolean;
  beforeBytes: number;
  afterBytes: number;
};

export type OptimizeResult = {
  svg: string;
  beforeBytes: number;
  afterBytes: number;
  savedBytes: number;
  reports: PassReport[];
};

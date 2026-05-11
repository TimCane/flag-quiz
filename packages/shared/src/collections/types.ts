export interface Flag {
  code: string;
  name: string;
  group: string;
  colors: string[];
  patterns: string[];
  symbols: string[];
  ext: "png" | "svg";
}

export interface GroupValue {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  groupLabel: string;
  itemLabel: string;
  groups: GroupValue[];
  flags: Flag[];
}

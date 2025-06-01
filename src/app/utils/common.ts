export type GroupingStrategy = "roundRobin" | "maxGroupCapacity";

export const groupingStrategyMap: Record<GroupingStrategy, string> = {
  roundRobin: "Round Robin",
  maxGroupCapacity: "Max Group Capacity",
};

export const groupingStrategyTooltips: Record<GroupingStrategy, string> = {
  roundRobin:
    "Attendees are assigned to groups one by one in a loop. For example: Group 1 → 2 → 3 → 1 again.",
  maxGroupCapacity:
    "Attendees are assigned based on a maximum group capacity. Once a group fills up, the next one starts filling. For example: if the max per group is 3, Group 1 gets filled with 3 people before starting to fill Group 2.",
};

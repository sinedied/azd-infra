export type DependencyGraph = Record<string, string[]>;

export type DependencyInfo = {
  graph: DependencyGraph;
  all: string[];
  missing: string[];
  unused: string[];
};

export function isDependencyUsed(dependency: string, graph: DependencyGraph): boolean {
  return Object.values(graph).some((deps) => deps.includes(dependency));
}

export function dependencyUsedBy(dependency: string, graph: DependencyGraph): string[] {
  return Object.entries(graph)
    .filter(([_, deps]) => deps.includes(dependency))
    .map(([file]) => file);
}

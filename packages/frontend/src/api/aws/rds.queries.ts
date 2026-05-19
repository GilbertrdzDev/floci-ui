import { useQuery } from "@tanstack/react-query";
import { rdsClient } from "./rds.api";

export const rdsQueryKeys = {
  instances: ["rds", "instances"] as const,
  instance: (identifier: string | null) =>
    ["rds", "instance", identifier] as const,
};

export function useRdsInstancesQuery() {
  return useQuery({
    queryKey: rdsQueryKeys.instances,
    queryFn: ({ signal }) => rdsClient.listInstances(signal),
    refetchInterval: 30_000,
  });
}

export function useRdsInstanceQuery(identifier: string | null) {
  return useQuery({
    queryKey: rdsQueryKeys.instance(identifier),
    queryFn: ({ signal }) => rdsClient.describeInstance(identifier!, signal),
    enabled: Boolean(identifier),
    refetchInterval: 30_000,
  });
}

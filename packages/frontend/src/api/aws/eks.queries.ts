import { useQuery } from "@tanstack/react-query";
import { eksClient } from "./eks.api";

export const eksQueryKeys = {
  clusters: ["eks", "clusters"] as const,
  cluster: (name: string | null) => ["eks", "cluster", name] as const,
  nodegroups: (clusterName: string | null) =>
    ["eks", "nodegroups", clusterName] as const,
  nodegroup: (clusterName: string | null, nodegroupName: string | null) =>
    ["eks", "nodegroup", clusterName, nodegroupName] as const,
};

export function useEksClustersQuery() {
  return useQuery({
    queryKey: eksQueryKeys.clusters,
    queryFn: ({ signal }) => eksClient.listClusters(signal),
    refetchInterval: 30_000,
  });
}

export function useEksClusterQuery(name: string | null) {
  return useQuery({
    queryKey: eksQueryKeys.cluster(name),
    queryFn: ({ signal }) => eksClient.describeCluster(name!, signal),
    enabled: Boolean(name),
    refetchInterval: 30_000,
  });
}

export function useEksNodegroupsQuery(clusterName: string | null) {
  return useQuery({
    queryKey: eksQueryKeys.nodegroups(clusterName),
    queryFn: ({ signal }) => eksClient.listNodegroups(clusterName!, signal),
    enabled: Boolean(clusterName),
    refetchInterval: 30_000,
  });
}

export function useEksNodegroupQuery(
  clusterName: string | null,
  nodegroupName: string | null,
) {
  return useQuery({
    queryKey: eksQueryKeys.nodegroup(clusterName, nodegroupName),
    queryFn: ({ signal }) =>
      eksClient.describeNodegroup(clusterName!, nodegroupName!, signal),
    enabled: Boolean(clusterName && nodegroupName),
    refetchInterval: 30_000,
  });
}

import { queryOptions } from "@tanstack/react-query";
import { getFeaturedDevelopments } from "@/lib/developments.functions";

export const featuredDevelopmentsQueryOptions = queryOptions({
  queryKey: ["featured-developments"],
  queryFn: () => getFeaturedDevelopments(),
});
import { PROPERTY_FEATURES, type PropertyFeature } from "./property-features";

/** Características marcadas, na ordem da lista central; chaves inválidas são ignoradas. */
export function selectedFeatures(raw: unknown): PropertyFeature[] {
  if (!Array.isArray(raw)) return [];
  const marked = new Set(raw.filter((k): k is string => typeof k === "string"));
  return PROPERTY_FEATURES.filter((f) => marked.has(f.key));
}

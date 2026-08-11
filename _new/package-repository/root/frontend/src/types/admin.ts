/** Entity field definition from config. */
export interface EntityField {
  name: string; type: string; optional?: boolean; normalizations?: string;
}
/** Entity constraint from config. */
export interface EntityConstraint {
  field: string; regex: string; when_present?: boolean;
}
/** Entity definition from config. */
export interface Entity {
  name: string; type: string;
  fields?: EntityField[]; constraints?: EntityConstraint[];
}
/** Blob store definition. */
export interface BlobStore {
  name: string; kind: string; root: string;
  addressing_mode?: string; max_blob_bytes?: number;
}
/** KV store definition. */
export interface KvStore { name: string; kind: string; root: string; }
/** API route definition. */
export interface ApiRoute {
  route_id: string; method: string; path: string;
  pipeline?: string; tags?: string;
}
/** Auth scope from config. */
export interface AuthScope { name: string; actions?: string; }
/** Auth policy from config. */
export interface AuthPolicy {
  name: string; effect: string; conditions?: string; requirements?: string;
}
/** Features configuration. */
export interface Features {
  mutable_tags?: boolean; allow_overwrite_artifacts?: boolean;
  proxy_enabled?: boolean; gc_enabled?: boolean;
}
/** Caching configuration. */
export interface Caching {
  response_cache_enabled?: boolean; response_cache_ttl?: number;
  blob_cache_enabled?: boolean; blob_cache_max_bytes?: number;
}
/** Capabilities configuration. */
export interface Capabilities {
  protocols?: string; storage?: string; features?: string;
}
/** Full admin config response. */
export interface AdminConfig {
  schema_version?: string; type_id?: string; description?: string;
  api_routes?: ApiRoute[]; entities?: Entity[];
  blob_stores?: BlobStore[]; kv_stores?: KvStore[];
  auth_scopes?: AuthScope[]; auth_policies?: AuthPolicy[];
  features?: Features; caching?: Caching; capabilities?: Capabilities;
}
/** A user-defined or built-in repo type. */
export interface RepoType {
  id: string; label: string; desc: string; color: string;
  /** Install instructions template with {ns}/{name}/{version}. */
  install?: string;
  builtin?: boolean;
  enabled?: boolean;
}
/** Admin tab identifiers. */
export type AdminTab =
  | 'overview' | 'entities' | 'storage' | 'routes'
  | 'auth' | 'features' | 'repo-types' | 'raw';

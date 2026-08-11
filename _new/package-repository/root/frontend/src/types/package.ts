/** Represents a package in the repository. */
export interface PackageInfo {
  /** Organization or owner namespace. */
  namespace: string;
  /** Package name. */
  name: string;
  /** Semantic version string. */
  version: string;
  /** Platform/architecture variant. */
  variant: string;
  /** Package type identifier (e.g. npm, deb, conan). */
  type: string;
  /** Size of the blob in bytes. */
  blob_size?: number;
  /** SHA256 content digest. */
  blob_digest?: string;
  /** Number of times this package was downloaded. */
  download_count?: number;
}

/** Version entry returned by the versions API. */
export interface PackageVersion {
  /** Semantic version string. */
  version: string;
  /** Platform/architecture variant. */
  variant: string;
  /** Size of the blob in bytes. */
  blob_size: number;
  /** SHA256 digest of the blob. */
  blob_digest: string;
}

/** User data stored in localStorage. */
export interface UserData {
  /** Username of the authenticated user. */
  username: string;
  /** User role (e.g. admin, user). */
  role?: string;
  /** Permission scopes granted to the user. */
  scopes?: string[];
}

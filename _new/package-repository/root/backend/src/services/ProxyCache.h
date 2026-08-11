/**
 * @file ProxyCache.h
 * @brief Pull-through cache: fetch a path from an upstream registry and cache
 *        the response bytes in the S3 blob store, keyed by the request path.
 *
 * Implements the proxy.fetch operation (see OPERATIONS.md / ROADMAP Milestone
 * C) so hosted adapters (npm, conan) can serve public packages on a cache
 * miss instead of 404ing.
 */

#pragma once

#include <string>

namespace repo
{

/// @brief Result of a proxy fetch.
struct ProxyResult {
    bool ok = false;
    std::string body;
};

class ProxyCache
{
  public:
    /// @brief GET @p upstreamBase + @p path, returning cached bytes when
    ///        present, else fetching upstream and caching the 2xx body.
    ///        Follows one redirect hop. Blocks on the event loop.
    static ProxyResult fetch(const std::string& upstreamBase,
                             const std::string& path);
};

} // namespace repo

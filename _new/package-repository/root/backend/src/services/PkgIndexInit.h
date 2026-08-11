/**
 * @file PkgIndexInit.h
 * @brief Creates Elasticsearch indices with mappings on startup.
 */

#pragma once

#include "ElasticClient.h"

namespace repo
{

/// @brief Ensures all pkgrepo ES indices exist with correct mappings.
class PkgIndexInit
{
  public:
    /// @brief Create all four pkgrepo indices if they do not exist.
    /// Safe to call multiple times; ES ignores duplicate creates.
    static void ensureIndices();

  private:
    /// @brief Create the pkgrepo-packages index.
    static void createPackagesIndex(ElasticClient& es);

    /// @brief Create the pkgrepo-artifacts index.
    static void createArtifactsIndex(ElasticClient& es);

    /// @brief Create the pkgrepo-tags index.
    static void createTagsIndex(ElasticClient& es);

    /// @brief Create the pkgrepo-users index.
    static void createUsersIndex(ElasticClient& es);
};

} // namespace repo

/**
 * @file PkgSearchService.h
 * @brief Package search and indexing via Elasticsearch.
 */

#pragma once

#include "ElasticClient.h"

#include <nlohmann/json.hpp>

#include <functional>
#include <string>
#include <vector>

namespace repo
{

using Json = nlohmann::json;
using SearchOk = std::function<void(const Json& hits)>;
using SearchErr = std::function<void(const std::string& msg)>;

/// @brief High-level search operations for the package repo.
class PkgSearchService
{
  public:
    /// @brief Search the pkgrepo-packages index.
    /// @param query  User search string.
    /// @param page   Zero-based page number.
    /// @param size   Results per page.
    /// @param onOk   Called with hits array on success.
    /// @param onErr  Called with error message on failure.
    static void searchPackages(const std::string& query,
                               int page, int size,
                               SearchOk onOk, SearchErr onErr);

    /// @brief Index a package document.
    /// @param pkgId        Package identifier.
    /// @param name         Package name.
    /// @param description  Package description text.
    /// @param version      Semver version string.
    /// @param tags         List of tag strings.
    /// @param onOk         Called on success.
    /// @param onErr        Called on failure.
    static void indexPackage(const std::string& pkgId,
                             const std::string& name,
                             const std::string& description,
                             const std::string& version,
                             const std::vector<std::string>& tags,
                             SearchOk onOk, SearchErr onErr);

    /// @brief Index an artifact document.
    /// @param artifactId  Artifact identifier.
    /// @param data        Artifact metadata as JSON.
    /// @param onOk        Called on success.
    /// @param onErr       Called on failure.
    static void indexArtifact(const std::string& artifactId,
                              const Json& data,
                              SearchOk onOk, SearchErr onErr);

    /// @brief Remove a package from the search index.
    /// @param pkgId  Package identifier.
    /// @param onOk   Called on success.
    /// @param onErr  Called on failure.
    static void removePackage(const std::string& pkgId,
                              SearchOk onOk, SearchErr onErr);
};

} // namespace repo

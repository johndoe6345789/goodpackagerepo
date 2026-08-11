/**
 * @file PgArtifactQuery.h
 * @brief List/versions/latest/count queries for artifacts.
 *
 * Split from PgArtifactStore.h to respect 100-line limit.
 */

#pragma once

#include "PgArtifactStore.h"

namespace repo
{
namespace pg_artifact
{

/// @brief List versions sorted descending.
inline std::vector<Json::Value> versions(int repoType, const std::string& ns,
                                         const std::string& name,
                                         int limit = 100)
{
    auto r =
        DbPool::get()->execSqlSync("SELECT * FROM artifacts WHERE repo_type=$1 "
                                   "AND namespace=$2 AND name=$3 "
                                   "ORDER BY version DESC LIMIT " +
                                       std::to_string(limit),
                                   repoType, ns, name);
    std::vector<Json::Value> out;
    for (const auto& row : r)
        out.push_back(PgArtifactStore::rowToJson(row));
    return out;
}

/// @brief Get latest version (first by desc sort).
inline Json::Value latest(int repoType, const std::string& ns,
                          const std::string& name)
{
    auto v = versions(repoType, ns, name, 1);
    return v.empty() ? Json::nullValue : v[0];
}

/// @brief List distinct packages with latest version.
inline std::vector<Json::Value> list(int repoType, int limit = 200)
{
    auto r =
        DbPool::get()->execSqlSync("SELECT DISTINCT ON (namespace, name) "
                                   "namespace, name, version, variant, "
                                   "blob_digest, blob_size, "
                                   "download_count, created_at "
                                   "FROM artifacts WHERE repo_type=$1 "
                                   "ORDER BY namespace, name, created_at DESC "
                                   "LIMIT " +
                                       std::to_string(limit),
                                   repoType);
    std::vector<Json::Value> out;
    for (const auto& row : r)
        out.push_back(PgArtifactStore::rowToJson(row));
    return out;
}

/// @brief Count total artifacts.
inline int64_t count()
{
    auto r = DbPool::get()->execSqlSync("SELECT count(*) AS c FROM artifacts");
    return r[0]["c"].as<int64_t>();
}

} // namespace pg_artifact
} // namespace repo

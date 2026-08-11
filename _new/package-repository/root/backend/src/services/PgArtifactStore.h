/**
 * @file PgArtifactStore.h
 * @brief PostgreSQL-backed artifact metadata store.
 *
 * Query helpers (list, versions, latest, count) are in
 * PgArtifactQuery.h.
 */

#pragma once

#include "DbPool.h"

#include <json/json.h>

#include <string>
#include <vector>

namespace repo
{

class PgArtifactStore
{
  public:
    /// @brief Publish artifact. Returns false if exists.
    static bool publish(int repoType, const std::string& ns,
                        const std::string& name, const std::string& version,
                        const std::string& variant, const std::string& digest,
                        int64_t size, const std::string& createdBy)
    {
        try {
            DbPool::get()->execSqlSync("INSERT INTO artifacts "
                                       "(repo_type,namespace,name,version,"
                                       "variant,blob_digest,blob_size,"
                                       "created_by) "
                                       "VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
                                       repoType, ns, name, version, variant,
                                       digest, size, createdBy);
            return true;
        } catch (...) {
            return false; // unique violation
        }
    }

    /// @brief Get artifact metadata by coordinates.
    static Json::Value get(int repoType, const std::string& ns,
                           const std::string& name, const std::string& version,
                           const std::string& variant)
    {
        auto r = DbPool::get()->execSqlSync(
            "SELECT * FROM artifacts WHERE repo_type=$1 "
            "AND namespace=$2 AND name=$3 "
            "AND version=$4 AND variant=$5",
            repoType, ns, name, version, variant);
        if (r.empty())
            return Json::nullValue;
        return rowToJson(r[0]);
    }

    /// @brief Increment download counter for an artifact.
    static void incrementDownloads(int repoType, const std::string& ns,
                                   const std::string& name,
                                   const std::string& version,
                                   const std::string& variant)
    {
        DbPool::get()->execSqlSync(
            "UPDATE artifacts SET download_count = download_count + 1 "
            "WHERE repo_type=$1 AND namespace=$2 AND name=$3 "
            "AND version=$4 AND variant=$5",
            repoType, ns, name, version, variant);
    }

    /// @brief Convert a DB row to JSON.
    static Json::Value rowToJson(const drogon::orm::Row& row)
    {
        Json::Value j;
        j["namespace"] = row["namespace"].as<std::string>();
        j["name"] = row["name"].as<std::string>();
        j["version"] = row["version"].as<std::string>();
        j["variant"] = row["variant"].as<std::string>();
        j["blob_digest"] = row["blob_digest"].as<std::string>();
        j["blob_size"] = (Json::Int64)row["blob_size"].as<int64_t>();
        j["download_count"] = (Json::Int64)row["download_count"].as<int64_t>();
        return j;
    }
};

} // namespace repo

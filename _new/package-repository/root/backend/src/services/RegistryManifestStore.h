#pragma once

#include "DbPool.h"
#include "PgTagStore.h"

#include <json/json.h>
#include <sstream>

namespace repo::registry_manifest
{
struct Record {
    int64_t id = 0;
    int64_t size = 0;
    std::string digest;
    std::string blobDigest;
    std::string mediaType;
};

inline Record fromRow(const drogon::orm::Row& row)
{
    Json::Value labels;
    Json::CharReaderBuilder rb;
    std::istringstream ss(row["labels"].as<std::string>());
    Json::parseFromStream(rb, ss, &labels, nullptr);
    return {row["id"].as<int64_t>(), row["blob_size"].as<int64_t>(),
            row["version"].as<std::string>(),
            row["blob_digest"].as<std::string>(),
            labels["media_type"].asString()};
}

inline Record byId(int64_t id)
{
    auto rows = DbPool::get()->execSqlSync("SELECT * FROM artifacts WHERE id=$1", id);
    return rows.empty() ? Record{} : fromRow(rows[0]);
}

inline Record byDigest(int repoType, const std::string& ns,
                       const std::string& name, const std::string& digest)
{
    auto rows = DbPool::get()->execSqlSync(
        "SELECT * FROM artifacts WHERE repo_type=$1 AND namespace=$2 "
        "AND name=$3 AND version=$4 AND variant='manifest'",
        repoType, ns, name, digest);
    return rows.empty() ? Record{} : fromRow(rows[0]);
}

inline Record byRef(int repoType, const std::string& ns,
                    const std::string& name, const std::string& ref)
{
    if (ref.rfind("sha256:", 0) == 0) return byDigest(repoType, ns, name, ref);
    const auto id = PgTagStore::resolve(repoType, ns, name, ref);
    return id == 0 ? Record{} : byId(id);
}
} // namespace repo::registry_manifest

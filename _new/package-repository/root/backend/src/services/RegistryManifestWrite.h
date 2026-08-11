#pragma once

#include "RegistryManifestStore.h"

namespace repo::registry_manifest
{
inline Record upsert(int repoType, const std::string& ns, const std::string& name,
                     const std::string& digest, const std::string& mediaType,
                     int64_t size, const std::string& createdBy)
{
    Json::Value labels;
    labels["kind"] = "manifest";
    labels["media_type"] = mediaType;
    Json::StreamWriterBuilder wb;
    wb["indentation"] = "";
    auto rows = DbPool::get()->execSqlSync(
        "INSERT INTO artifacts (repo_type,namespace,name,version,variant,"
        "blob_digest,blob_size,labels,created_by) "
        "VALUES ($1,$2,$3,$4,'manifest',$5,$6,$7::jsonb,$8) "
        "ON CONFLICT (repo_type,namespace,name,version,variant) "
        "DO UPDATE SET blob_digest=$5, blob_size=$6, labels=$7::jsonb "
        "RETURNING *",
        repoType, ns, name, digest, digest, size, Json::writeString(wb, labels),
        createdBy);
    return fromRow(rows[0]);
}

inline void tag(int repoType, const std::string& ns, const std::string& name,
                const std::string& ref, int64_t targetId,
                const std::string& updatedBy)
{
    if (ref.rfind("sha256:", 0) == 0) return;
    PgTagStore::set(repoType, ns, name, ref, targetId, updatedBy);
}

inline void erase(int64_t id)
{
    DbPool::get()->execSqlSync("DELETE FROM tags WHERE target_id=$1", id);
    DbPool::get()->execSqlSync("DELETE FROM artifacts WHERE id=$1", id);
}
} // namespace repo::registry_manifest

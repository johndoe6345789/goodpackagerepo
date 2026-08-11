/**
 * @file PgTagStore.h
 * @brief PostgreSQL-backed tag and event store.
 */

#pragma once

#include "DbPool.h"

#include <json/json.h>

#include <string>

namespace repo
{

class PgTagStore
{
  public:
    /// @brief Set or update a tag pointing to an artifact.
    static void set(int repoType, const std::string& ns,
                    const std::string& name, const std::string& tag,
                    int64_t targetId, const std::string& updatedBy)
    {
        DbPool::get()->execSqlSync("INSERT INTO tags "
                                   "(repo_type,namespace,name,tag,"
                                   "target_id,updated_by) "
                                   "VALUES ($1,$2,$3,$4,$5,$6) "
                                   "ON CONFLICT (repo_type,namespace,name,tag) "
                                   "DO UPDATE SET target_id=$5, updated_by=$6, "
                                   "updated_at=now()",
                                   repoType, ns, name, tag, targetId,
                                   updatedBy);
    }

    /// @brief Get the artifact ID for a tag, or 0.
    static int64_t resolve(int repoType, const std::string& ns,
                           const std::string& name, const std::string& tag)
    {
        auto r =
            DbPool::get()->execSqlSync("SELECT target_id FROM tags "
                                       "WHERE repo_type=$1 AND namespace=$2 "
                                       "AND name=$3 AND tag=$4",
                                       repoType, ns, name, tag);
        return r.empty() ? 0 : r[0]["target_id"].as<int64_t>();
    }

    /// @brief Emit an event to the event log.
    static void emitEvent(int repoType, const std::string& type,
                          const Json::Value& payload)
    {
        Json::StreamWriterBuilder wb;
        wb["indentation"] = "";
        DbPool::get()->execSqlSync("INSERT INTO events "
                                   "(repo_type,event_type,payload) "
                                   "VALUES ($1,$2,$3::jsonb)",
                                   repoType, type,
                                   Json::writeString(wb, payload));
    }
};

} // namespace repo

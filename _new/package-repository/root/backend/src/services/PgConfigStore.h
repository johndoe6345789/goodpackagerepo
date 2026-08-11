/**
 * @file PgConfigStore.h
 * @brief PostgreSQL-backed abstract repo configuration.
 */

#pragma once

#include "DbPool.h"

#include <json/json.h>

#include <string>

namespace repo
{

class PgConfigStore
{
  public:
    /// @brief Get or create the default repo type ID.
    static int defaultRepoType()
    {
        auto r = DbPool::get()->execSqlSync("SELECT id FROM repo_types "
                                            "WHERE name='generic'");
        return r.empty() ? 0 : r[0]["id"].as<int>();
    }

    /// @brief Get entity definition for a repo type.
    static Json::Value entityDef(int repoType, const std::string& name)
    {
        auto r =
            DbPool::get()->execSqlSync("SELECT fields,constraints,primary_key "
                                       "FROM entity_defs WHERE repo_type=$1 "
                                       "AND name=$2",
                                       repoType, name);
        if (r.empty())
            return Json::nullValue;

        Json::Value out;
        out["fields"] = parseJson(r[0]["fields"].as<std::string>());
        out["constraints"] = parseJson(r[0]["constraints"].as<std::string>());
        out["primary_key"] = parseJson(r[0]["primary_key"].as<std::string>());
        return out;
    }

    /// @brief Get all features as JSON object.
    static Json::Value features()
    {
        auto r = DbPool::get()->execSqlSync("SELECT key,value FROM features");
        Json::Value out(Json::objectValue);
        for (const auto& row : r) {
            out[row["key"].as<std::string>()] =
                parseJson(row["value"].as<std::string>());
        }
        return out;
    }

    /// @brief Get all auth scopes.
    static Json::Value scopes()
    {
        auto r =
            DbPool::get()->execSqlSync("SELECT name,actions FROM auth_scopes");
        Json::Value out(Json::arrayValue);
        for (const auto& row : r) {
            Json::Value s;
            s["name"] = row["name"].as<std::string>();
            s["actions"] = parseJson(row["actions"].as<std::string>());
            out.append(s);
        }
        return out;
    }

    /// @brief Get blob store configurations.
    static Json::Value blobStores()
    {
        auto r = DbPool::get()->execSqlSync(
            "SELECT name,kind,config FROM blob_stores");
        Json::Value out(Json::arrayValue);
        for (const auto& row : r) {
            Json::Value s;
            s["name"] = row["name"].as<std::string>();
            s["kind"] = row["kind"].as<std::string>();
            s["config"] = parseJson(row["config"].as<std::string>());
            out.append(s);
        }
        return out;
    }

  private:
    static Json::Value parseJson(const std::string& str)
    {
        Json::Value v;
        Json::CharReaderBuilder rb;
        std::istringstream ss(str);
        Json::parseFromStream(rb, ss, &v, nullptr);
        return v;
    }
};

} // namespace repo

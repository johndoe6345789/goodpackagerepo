#pragma once

#include "DbPool.h"

#include <string>
#include <vector>

namespace repo::registry_catalog
{
inline std::vector<std::string> repos(int repoType, int limit = 1000)
{
    auto rows = DbPool::get()->execSqlSync(
        "SELECT DISTINCT namespace,name FROM artifacts "
        "WHERE repo_type=$1 AND variant='manifest' "
        "ORDER BY namespace,name LIMIT " + std::to_string(limit),
        repoType);
    std::vector<std::string> out;
    for (const auto& row : rows) {
        out.push_back(row["namespace"].as<std::string>() + "/" +
                      row["name"].as<std::string>());
    }
    return out;
}

inline std::vector<std::string> tags(int repoType, const std::string& ns,
                                     const std::string& name)
{
    auto rows = DbPool::get()->execSqlSync(
        "SELECT tag FROM tags WHERE repo_type=$1 "
        "AND namespace=$2 AND name=$3 ORDER BY tag",
        repoType, ns, name);
    std::vector<std::string> out;
    for (const auto& row : rows) out.push_back(row["tag"].as<std::string>());
    return out;
}
} // namespace repo::registry_catalog

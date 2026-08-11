/**
 * @file AdapterTemplate.h
 * @brief Template expansion engine for protocol adapters.
 *
 * Replaces placeholders like {name}, {ver}, {digest} in
 * DB-stored templates to produce protocol-specific responses.
 */

#pragma once

#include "PgAdapterStore.h"

#include <json/json.h>

#include <map>
#include <string>
#include <vector>

namespace repo
{

/// @brief Replace all {key} placeholders with values.
inline std::string expandTpl(
    const std::string& tpl,
    const std::map<std::string, std::string>& vars)
{
    std::string out = tpl;
    for (const auto& [k, v] : vars) {
        auto ph = "{" + k + "}";
        size_t pos = 0;
        while ((pos = out.find(ph, pos)) != std::string::npos) {
            out.replace(pos, ph.size(), v);
            pos += v.size();
        }
    }
    return out;
}

/// @brief Count Drogon path params ({1}, {2}, ...) in route.
inline int countPathParams(const std::string& route)
{
    int n = 0;
    for (int i = 1; i <= 9; ++i) {
        auto ph = "{" + std::to_string(i) + "}";
        if (route.find(ph) != std::string::npos) ++n;
    }
    return n;
}

/// @brief Build template vars for one artifact row.
inline std::map<std::string, std::string> rowVars(
    const AdapterInfo& a, const std::string& base,
    const std::string& fallbackName, const Json::Value& row)
{
    auto name = row.isMember("name")
        ? row["name"].asString() : fallbackName;
    auto ver = row["version"].asString();
    auto digest = row["blob_digest"].asString();
    auto d12 = digest.substr(digest.find(':') + 1, 12);
    auto dlUrl = base + a.prefix + "/dl/" + name + "/" + ver;
    return {
        {"name", name}, {"ver", ver},
        {"digest", digest}, {"digest12", d12},
        {"size", std::to_string(row["blob_size"].asInt64())},
        {"dl_url", dlUrl}, {"base", base},
        {"prefix", a.prefix}, {"ns", a.ns},
        {"ext", a.tarballExt}, {"latest", ver}
    };
}

/// @brief Expand entries + wrap in meta template.
inline std::string renderMeta(
    const AdapterInfo& a, const std::string& base,
    const std::string& name,
    const std::vector<Json::Value>& items)
{
    std::string entries;
    std::string latest = items.empty()
        ? "" : items[0]["version"].asString();
    for (size_t i = 0; i < items.size(); ++i) {
        auto vars = rowVars(a, base, name, items[i]);
        vars["latest"] = latest;
        if (i > 0) entries += a.entrySep;
        entries += expandTpl(a.entryTpl, vars);
    }
    return expandTpl(a.metaTpl, {
        {"name", name}, {"latest", latest},
        {"base", base}, {"ns", a.ns},
        {"ENTRIES", entries}
    });
}

} // namespace repo

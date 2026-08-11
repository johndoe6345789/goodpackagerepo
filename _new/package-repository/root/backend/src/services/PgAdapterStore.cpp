/**
 * @file PgAdapterStore.cpp
 * @brief Protocol adapter PostgreSQL queries.
 */

#include "PgAdapterStore.h"

namespace repo
{

std::vector<AdapterInfo> PgAdapterStore::loadAll(int repoType)
{
    auto rows = DbPool::get()->execSqlSync(
        "SELECT id, repo_type, name, prefix, namespace, "
        "content_type, tarball_ext, meta_format, "
        "meta_regex, dl_regex, meta_tpl, entry_tpl, "
        "entry_sep, meta_ct, is_index "
        "FROM protocol_adapters "
        "WHERE repo_type=$1 AND enabled=true "
        "ORDER BY name",
        repoType);

    std::vector<AdapterInfo> out;
    out.reserve(rows.size());
    for (const auto& r : rows) {
        AdapterInfo a;
        a.id = r["id"].as<int>();
        a.repoType = r["repo_type"].as<int>();
        a.name = r["name"].as<std::string>();
        a.prefix = r["prefix"].as<std::string>();
        a.ns = r["namespace"].as<std::string>();
        a.contentType = r["content_type"].as<std::string>();
        a.tarballExt = r["tarball_ext"].as<std::string>();
        a.metaFormat = r["meta_format"].as<std::string>();
        a.metaRegex = r["meta_regex"].as<std::string>();
        a.dlRegex = r["dl_regex"].as<std::string>();
        a.metaTpl = r["meta_tpl"].as<std::string>();
        a.entryTpl = r["entry_tpl"].as<std::string>();
        a.entrySep = r["entry_sep"].as<std::string>();
        a.metaCt = r["meta_ct"].as<std::string>();
        a.isIndex = r["is_index"].as<bool>();
        out.push_back(std::move(a));
    }
    return out;
}

const AdapterInfo* PgAdapterStore::findByName(
    const std::vector<AdapterInfo>& adapters,
    const std::string& name)
{
    for (const auto& a : adapters) {
        if (a.name == name)
            return &a;
    }
    return nullptr;
}

} // namespace repo

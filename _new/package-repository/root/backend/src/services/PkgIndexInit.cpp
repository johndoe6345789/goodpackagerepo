/**
 * @file PkgIndexInit.cpp
 * @brief Creates pkgrepo Elasticsearch indices with mappings.
 */

#include "PkgIndexInit.h"

namespace repo
{

static const Json INDEX_SETTINGS = {
    {"number_of_shards", 1},
    {"number_of_replicas", 0},
    {"refresh_interval", "1s"}
};

void PkgIndexInit::ensureIndices()
{
    auto es = ElasticClient();
    createPackagesIndex(es);
    createArtifactsIndex(es);
    createTagsIndex(es);
    createUsersIndex(es);
}

void PkgIndexInit::createPackagesIndex(ElasticClient& es)
{
    Json body = {
        {"settings", INDEX_SETTINGS},
        {"mappings", {{"properties", {
            {"name",        {{"type", "text"}}},
            {"description", {{"type", "text"}}},
            {"version",     {{"type", "keyword"}}},
            {"tags",        {{"type", "keyword"}}},
            {"author",      {{"type", "keyword"}}}
        }}}}
    };
    es.createIndex("pkgrepo-packages", body,
        [](bool ok, const Json&) {
            if (ok) LOG_INFO << "ES: pkgrepo-packages ready";
        });
}

void PkgIndexInit::createArtifactsIndex(ElasticClient& es)
{
    Json body = {
        {"settings", INDEX_SETTINGS},
        {"mappings", {{"properties", {
            {"filename",     {{"type", "text"}}},
            {"package_id",   {{"type", "keyword"}}},
            {"content_type", {{"type", "keyword"}}},
            {"size",         {{"type", "long"}}}
        }}}}
    };
    es.createIndex("pkgrepo-artifacts", body,
        [](bool ok, const Json&) {
            if (ok) LOG_INFO << "ES: pkgrepo-artifacts ready";
        });
}

void PkgIndexInit::createTagsIndex(ElasticClient& es)
{
    Json body = {
        {"settings", INDEX_SETTINGS},
        {"mappings", {{"properties", {
            {"name",          {{"type", "keyword"}}},
            {"package_count", {{"type", "integer"}}}
        }}}}
    };
    es.createIndex("pkgrepo-tags", body,
        [](bool ok, const Json&) {
            if (ok) LOG_INFO << "ES: pkgrepo-tags ready";
        });
}

void PkgIndexInit::createUsersIndex(ElasticClient& es)
{
    Json body = {
        {"settings", INDEX_SETTINGS},
        {"mappings", {{"properties", {
            {"username", {{"type", "text"}}},
            {"email",    {{"type", "text"}}}
        }}}}
    };
    es.createIndex("pkgrepo-users", body,
        [](bool ok, const Json&) {
            if (ok) LOG_INFO << "ES: pkgrepo-users ready";
        });
}

} // namespace repo

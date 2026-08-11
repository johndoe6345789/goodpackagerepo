/**
 * @file PkgSearchService.cpp
 * @brief Implementation of searchPackages.
 */

#include "PkgSearchService.h"

namespace repo
{

static constexpr auto PKG_INDEX = "pkgrepo-packages";
static constexpr int DEFAULT_SIZE = 20;
static constexpr int MAX_SIZE = 100;

void PkgSearchService::searchPackages(
    const std::string& query, int page, int size,
    SearchOk onOk, SearchErr onErr)
{
    if (size <= 0) size = DEFAULT_SIZE;
    if (size > MAX_SIZE) size = MAX_SIZE;
    if (page < 0) page = 0;

    Json body = {
        {"from", page * size},
        {"size", size},
        {"query", {
            {"multi_match", {
                {"query", query},
                {"fields", {"name^3", "description", "tags"}},
                {"fuzziness", "AUTO"}
            }}
        }},
        {"highlight", {
            {"fields", {
                {"name", Json::object()},
                {"description", Json::object()}
            }},
            {"pre_tags", {"<em>"}},
            {"post_tags", {"</em>"}}
        }}
    };

    auto client = std::make_shared<ElasticClient>();
    client->search(
        PKG_INDEX, body,
        [onOk, onErr, client](bool ok, const Json& resp) {
            if (!ok) {
                onErr(resp.value("error", "search_failed"));
                return;
            }
            onOk(resp.value("hits", Json::object()));
        });
}

} // namespace repo

/**
 * @file PkgSearchIndex.cpp
 * @brief Implementation of indexPackage, indexArtifact, removePackage.
 */

#include "PkgSearchService.h"

namespace repo
{

static constexpr auto PKG_INDEX = "pkgrepo-packages";
static constexpr auto ART_INDEX = "pkgrepo-artifacts";

void PkgSearchService::indexPackage(
    const std::string& pkgId, const std::string& name,
    const std::string& description, const std::string& version,
    const std::vector<std::string>& tags,
    SearchOk onOk, SearchErr onErr)
{
    Json doc = {
        {"name", name},
        {"description", description},
        {"version", version},
        {"tags", tags}
    };

    auto client = std::make_shared<ElasticClient>();
    client->indexDoc(
        PKG_INDEX, pkgId, doc,
        [onOk, onErr, client](bool ok, const Json& resp) {
            if (!ok) {
                onErr(resp.value("error", "index_failed"));
                return;
            }
            onOk(resp);
        });
}

void PkgSearchService::indexArtifact(
    const std::string& artifactId, const Json& data,
    SearchOk onOk, SearchErr onErr)
{
    auto client = std::make_shared<ElasticClient>();
    client->indexDoc(
        ART_INDEX, artifactId, data,
        [onOk, onErr, client](bool ok, const Json& resp) {
            if (!ok) {
                onErr(resp.value("error", "index_failed"));
                return;
            }
            onOk(resp);
        });
}

void PkgSearchService::removePackage(
    const std::string& pkgId,
    SearchOk onOk, SearchErr onErr)
{
    auto client = std::make_shared<ElasticClient>();
    client->deleteDoc(
        PKG_INDEX, pkgId,
        [onOk, onErr, client](bool ok, const Json& resp) {
            if (!ok) {
                onErr(resp.value("error", "delete_failed"));
                return;
            }
            onOk(resp);
        });
}

} // namespace repo

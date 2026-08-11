/**
 * @file ArtifactQuery.cpp
 * @brief Artifact list, latest, and versions endpoints.
 *
 * Tag management is in ArtifactTag.cpp.
 */

#include "../services/Globals.h"
#include "../services/PgArtifactQuery.h"
#include "../services/PgArtifactStore.h"
#include "ArtifactCtrl.h"

using namespace drogon;

namespace repo
{

static Json::Value errJson(const std::string& code, const std::string& msg)
{
    Json::Value e;
    e["error"]["code"] = code;
    e["error"]["message"] = msg;
    return e;
}

void ArtifactCtrl::listPackages(
    const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto rows = pg_artifact::list(Globals::repoType);
    Json::Value out;
    out["packages"] = Json::arrayValue;
    for (const auto& r : rows) {
        auto digest = r["blob_digest"].asString();
        if (!digest.empty() && Globals::blobs->exists(digest))
            out["packages"].append(r);
    }
    cb(HttpResponse::newHttpJsonResponse(out));
}

void ArtifactCtrl::latest(const HttpRequestPtr& req,
                          std::function<void(const HttpResponsePtr&)>&& cb,
                          const std::string& ns, const std::string& name)
{
    auto v = pg_artifact::latest(Globals::repoType, ns, name);
    if (v.isNull()) {
        auto r = HttpResponse::newHttpJsonResponse(
            errJson("NOT_FOUND", "No versions found"));
        r->setStatusCode(k404NotFound);
        cb(r);
        return;
    }
    cb(HttpResponse::newHttpJsonResponse(v));
}

void ArtifactCtrl::versions(const HttpRequestPtr& req,
                            std::function<void(const HttpResponsePtr&)>&& cb,
                            const std::string& ns, const std::string& name)
{
    auto rows = pg_artifact::versions(Globals::repoType, ns, name);
    Json::Value out;
    out["namespace"] = ns;
    out["name"] = name;
    out["versions"] = Json::arrayValue;
    for (const auto& r : rows)
        out["versions"].append(r);
    cb(HttpResponse::newHttpJsonResponse(out));
}

} // namespace repo

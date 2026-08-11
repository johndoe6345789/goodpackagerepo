/**
 * @file ArtifactCtrl.cpp
 * @brief Artifact publish and fetch via PostgreSQL.
 */

#include "ArtifactCtrl.h"
#include "../services/Globals.h"
#include "../services/PgArtifactStore.h"
#include "../services/PgTagStore.h"

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

void ArtifactCtrl::publish(const HttpRequestPtr& req,
                           std::function<void(const HttpResponsePtr&)>&& cb,
                           const std::string& ns, const std::string& name,
                           const std::string& version,
                           const std::string& variant)
{
    auto p = req->attributes()->get<Json::Value>("principal");
    auto body = std::string(req->body());

    auto [digest, size] = Globals::blobs->store(body);

    bool ok =
        PgArtifactStore::publish(Globals::repoType, ns, name, version, variant,
                                 digest, (int64_t)size, p["sub"].asString());

    if (!ok) {
        auto r = HttpResponse::newHttpJsonResponse(
            errJson("ALREADY_EXISTS", "Artifact exists"));
        r->setStatusCode(k409Conflict);
        cb(r);
        return;
    }

    // Emit publish event
    Json::Value evt;
    evt["namespace"] = ns;
    evt["name"] = name;
    evt["version"] = version;
    evt["variant"] = variant;
    evt["digest"] = digest;
    PgTagStore::emitEvent(Globals::repoType, "artifact.published", evt);

    Json::Value out;
    out["ok"] = true;
    out["digest"] = digest;
    out["size"] = (Json::UInt64)size;
    auto r = HttpResponse::newHttpJsonResponse(out);
    r->setStatusCode(k201Created);
    cb(r);
}

void ArtifactCtrl::fetch(const HttpRequestPtr& req,
                         std::function<void(const HttpResponsePtr&)>&& cb,
                         const std::string& ns, const std::string& name,
                         const std::string& version, const std::string& variant)
{
    auto meta =
        PgArtifactStore::get(Globals::repoType, ns, name, version, variant);
    if (meta.isNull()) {
        auto r = HttpResponse::newHttpJsonResponse(
            errJson("NOT_FOUND", "Artifact not found"));
        r->setStatusCode(k404NotFound);
        cb(r);
        return;
    }

    auto data = Globals::blobs->read(meta["blob_digest"].asString());
    if (data.empty()) {
        auto r = HttpResponse::newHttpJsonResponse(
            errJson("BLOB_NOT_FOUND", "Blob missing"));
        r->setStatusCode(k404NotFound);
        cb(r);
        return;
    }

    PgArtifactStore::incrementDownloads(
        Globals::repoType, ns, name, version, variant);

    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeCode(CT_APPLICATION_OCTET_STREAM);
    r->setBody(std::move(data));
    cb(r);
}

} // namespace repo

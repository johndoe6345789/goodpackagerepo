#include "RegistryV2Ctrl.h"
#include "../services/Globals.h"
#include "../services/RegistryAuth.h"
#include "../services/RegistryManifestStore.h"
#include "../services/RegistryManifestWrite.h"

using namespace drogon;

namespace repo
{
namespace
{
std::string actor(const Json::Value& principal)
{
    return principal.isMember("username") ? principal["username"].asString()
                                          : principal["sub"].asString();
}

void manifestResp(std::function<void(const HttpResponsePtr&)>&& cb,
                  const registry_manifest::Record& rec, bool withBody)
{
    auto resp = HttpResponse::newHttpResponse();
    registry_auth::addHeaders(resp);
    const auto exists = rec.id != 0 && Globals::blobs->exists(rec.blobDigest);
    resp->setStatusCode(exists ? k200OK : k404NotFound);
    if (exists) {
        resp->setContentTypeString(rec.mediaType);
        resp->addHeader("Docker-Content-Digest", rec.digest);
        if (withBody) resp->setBody(Globals::blobs->read(rec.blobDigest));
    }
    cb(resp);
}
}

void RegistryV2Ctrl::headManifest(const HttpRequestPtr& req,
                                  std::function<void(const HttpResponsePtr&)>&& cb,
                                  const std::string& ns, const std::string& name,
                                  const std::string& ref)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "read")) return cb(registry_auth::denied());
    manifestResp(std::move(cb), registry_manifest::byRef(Globals::repoType, ns, name, ref), false);
}

void RegistryV2Ctrl::getManifest(const HttpRequestPtr& req,
                                 std::function<void(const HttpResponsePtr&)>&& cb,
                                 const std::string& ns, const std::string& name,
                                 const std::string& ref)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "read")) return cb(registry_auth::denied());
    manifestResp(std::move(cb), registry_manifest::byRef(Globals::repoType, ns, name, ref), true);
}

void RegistryV2Ctrl::putManifest(const HttpRequestPtr& req,
                                 std::function<void(const HttpResponsePtr&)>&& cb,
                                 const std::string& ns, const std::string& name,
                                 const std::string& ref)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "write")) return cb(registry_auth::denied());
    const auto body = std::string(req->body());
    const auto digest = S3BlobStore::sha256(body);
    if (ref.rfind("sha256:", 0) == 0 && ref != digest) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest);
        registry_auth::addHeaders(resp);
        return cb(resp);
    }
    const auto mediaType = req->getHeader("Content-Type").empty()
                               ? "application/vnd.oci.image.manifest.v1+json"
                               : req->getHeader("Content-Type");
    Globals::blobs->store(body);
    auto rec = registry_manifest::upsert(Globals::repoType, ns, name, digest,
                                         mediaType, (int64_t)body.size(), actor(principal));
    registry_manifest::tag(Globals::repoType, ns, name, ref, rec.id, actor(principal));
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(k201Created);
    registry_auth::addHeaders(resp);
    resp->addHeader("Docker-Content-Digest", digest);
    resp->addHeader("Location", "/v2/" + ns + "/" + name + "/manifests/" + digest);
    cb(resp);
}

void RegistryV2Ctrl::deleteManifest(const HttpRequestPtr& req,
                                    std::function<void(const HttpResponsePtr&)>&& cb,
                                    const std::string& ns, const std::string& name,
                                    const std::string& ref)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "write")) return cb(registry_auth::denied());
    auto rec = registry_manifest::byRef(Globals::repoType, ns, name, ref);
    if (rec.id != 0) registry_manifest::erase(rec.id);
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(k202Accepted);
    registry_auth::addHeaders(resp);
    cb(resp);
}
} // namespace repo

#include "RegistryV2Ctrl.h"
#include "../services/Globals.h"
#include "../services/RegistryAuth.h"
#include "../services/RegistryCatalogStore.h"

using namespace drogon;

namespace repo
{
void RegistryV2Ctrl::ping(const HttpRequestPtr&,
                          std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto resp = HttpResponse::newHttpResponse();
    registry_auth::addHeaders(resp);
    resp->setStatusCode(k200OK);
    cb(resp);
}

void RegistryV2Ctrl::catalog(const HttpRequestPtr& req,
                             std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "read")) return cb(registry_auth::denied());
    Json::Value out;
    for (const auto& repoName : registry_catalog::repos(Globals::repoType)) {
        out["repositories"].append(repoName);
    }
    auto resp = HttpResponse::newHttpJsonResponse(out);
    registry_auth::addHeaders(resp);
    cb(resp);
}

void RegistryV2Ctrl::tags(const HttpRequestPtr& req,
                          std::function<void(const HttpResponsePtr&)>&& cb,
                          const std::string& ns, const std::string& name)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "read")) return cb(registry_auth::denied());
    Json::Value out;
    out["name"] = ns + "/" + name;
    for (const auto& tag : registry_catalog::tags(Globals::repoType, ns, name)) {
        out["tags"].append(tag);
    }
    auto resp = HttpResponse::newHttpJsonResponse(out);
    registry_auth::addHeaders(resp);
    cb(resp);
}
} // namespace repo

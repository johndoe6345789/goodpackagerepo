/**
 * @file AdapterHandlers.cpp
 * @brief Template-driven handler implementations.
 *
 * Uses renderMeta() from AdapterTemplate.h to produce
 * protocol-native responses for any adapter type.
 */

#include "AdapterHandlers.h"
#include "AdapterProxy.h"
#include "../services/AdapterTemplate.h"
#include "../services/Globals.h"
#include "../services/PgArtifactQuery.h"
#include "../services/PgArtifactStore.h"

using namespace drogon;

namespace repo
{

static std::string baseUrl(
    const HttpRequestPtr& req)
{
    auto scheme =
        req->getHeader("X-Forwarded-Proto");
    if (scheme.empty()) scheme = "http";
    return scheme + "://"
        + req->getHeader("Host");
}

void handleIndex(
    const AdapterInfo& a,
    const HttpRequestPtr& req,
    std::function<void(
        const HttpResponsePtr&)>&& cb)
{
    auto all =
        pg_artifact::list(Globals::repoType);
    std::vector<Json::Value> matched;
    for (auto& p : all)
        if (p["namespace"].asString() == a.ns)
            matched.push_back(std::move(p));
    auto body = renderMeta(
        a, baseUrl(req), "index", matched);
    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString(a.metaCt);
    r->setBody(std::move(body));
    cb(r);
}

void handlePackageMeta(
    const AdapterInfo& a,
    const HttpRequestPtr& req,
    const std::string& name,
    std::function<void(
        const HttpResponsePtr&)>&& cb)
{
    auto vers = pg_artifact::versions(
        Globals::repoType, a.ns, name);
    if (vers.empty()) {
        auto r = proxyNpmMeta(a, req, name);
        cb(r ? r : HttpResponse::newNotFoundResponse());
        return;
    }
    auto body = renderMeta(
        a, baseUrl(req), name, vers);
    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString(a.metaCt);
    r->setBody(std::move(body));
    cb(r);
}

void handleVersionMeta(
    const AdapterInfo& a,
    const HttpRequestPtr& req,
    const std::string& name,
    const std::string& ver,
    std::function<void(
        const HttpResponsePtr&)>&& cb)
{
    auto meta = PgArtifactStore::get(
        Globals::repoType, a.ns, name, ver,
        "default");
    if (meta.isNull()) {
        cb(HttpResponse::newNotFoundResponse());
        return;
    }
    std::vector<Json::Value> items = {meta};
    auto body = renderMeta(
        a, baseUrl(req), name, items);
    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString(a.metaCt);
    r->setBody(std::move(body));
    cb(r);
}

} // namespace repo

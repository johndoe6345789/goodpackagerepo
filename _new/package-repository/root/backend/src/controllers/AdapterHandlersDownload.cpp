/**
 * @file AdapterHandlersDownload.cpp
 * @brief Download handler for the package adapter.
 *
 * Resolves blob data and returns the artifact binary.
 */

#include "AdapterHandlers.h"
#include "AdapterProxy.h"
#include "../services/AdapterTemplate.h"
#include "../services/Globals.h"
#include "../services/PgArtifactStore.h"

using namespace drogon;

namespace repo
{

void handleDownload(
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
        auto r = proxyNpmDownload(a, name, ver);
        cb(r ? r : HttpResponse::newNotFoundResponse());
        return;
    }
    auto data = Globals::blobs->read(
        meta["blob_digest"].asString());
    if (data.empty()) {
        cb(HttpResponse::newNotFoundResponse());
        return;
    }
    PgArtifactStore::incrementDownloads(
        Globals::repoType, a.ns, name, ver,
        "default");
    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString(a.contentType);
    r->setBody(std::move(data));
    cb(r);
}

} // namespace repo

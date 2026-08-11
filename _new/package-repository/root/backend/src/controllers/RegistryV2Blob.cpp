#include "RegistryV2Ctrl.h"
#include "../services/Globals.h"
#include "../services/RegistryAuth.h"

using namespace drogon;

namespace repo
{
namespace
{
void blobResp(std::function<void(const HttpResponsePtr&)>&& cb,
              const std::string& digest, bool withBody)
{
    const auto exists = Globals::blobs->exists(digest);
    auto resp = HttpResponse::newHttpResponse();
    registry_auth::addHeaders(resp);
    resp->setStatusCode(exists ? k200OK : k404NotFound);
    if (exists) {
        resp->setContentTypeCode(CT_APPLICATION_OCTET_STREAM);
        resp->addHeader("Docker-Content-Digest", digest);
        if (withBody) resp->setBody(Globals::blobs->read(digest));
    }
    cb(resp);
}
}

void RegistryV2Ctrl::headBlob(const HttpRequestPtr& req,
                              std::function<void(const HttpResponsePtr&)>&& cb,
                              const std::string&, const std::string&,
                              const std::string& digest)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "read")) return cb(registry_auth::denied());
    blobResp(std::move(cb), digest, false);
}

void RegistryV2Ctrl::getBlob(const HttpRequestPtr& req,
                             std::function<void(const HttpResponsePtr&)>&& cb,
                             const std::string&, const std::string&,
                             const std::string& digest)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "read")) return cb(registry_auth::denied());
    blobResp(std::move(cb), digest, true);
}
} // namespace repo

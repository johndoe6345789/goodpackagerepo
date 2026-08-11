#include "RegistryV2Ctrl.h"
#include "../services/RegistryAuth.h"
#include "../services/RegistryUploadStore.h"

#include <memory>
#include <thread>

using namespace drogon;

namespace repo
{
namespace
{
void setUploadHeaders(const HttpResponsePtr& resp, const std::string& ns,
                      const std::string& name, const std::string& uuid,
                      int64_t size)
{
    registry_auth::addHeaders(resp);
    resp->addHeader("Docker-Upload-UUID", uuid);
    resp->addHeader("Location", "/v2/" + ns + "/" + name + "/blobs/uploads/" + uuid);
    resp->addHeader("Range", size > 0 ? "0-" + std::to_string(size - 1) : "0-0");
}
}

void RegistryV2Ctrl::startUpload(const HttpRequestPtr& req,
                                 std::function<void(const HttpResponsePtr&)>&& cb,
                                 const std::string& ns, const std::string& name)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "write")) return cb(registry_auth::denied());
    const auto digest = req->getParameter("digest");
    if (!digest.empty()) {
        // Monolithic single-request upload: body IS the blob.
        // Run off the IO thread — store() does a blocking S3 PUT.
        auto cbPtr = std::make_shared<std::function<void(const HttpResponsePtr&)>>(std::move(cb));
        std::thread([ns, name, digest, req, cbPtr]() {
            const auto stored =
                Globals::blobs->store(std::string(req->body())).first;
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(stored == digest ? k201Created : k400BadRequest);
            registry_auth::addHeaders(resp);
            if (stored == digest) {
                resp->addHeader("Docker-Content-Digest", stored);
                resp->addHeader("Location",
                                "/v2/" + ns + "/" + name + "/blobs/" + stored);
            }
            (*cbPtr)(resp);
        }).detach();
        return;
    }
    const auto mount = req->getParameter("mount");
    if (!mount.empty() && Globals::blobs->exists(mount)) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k201Created);
        registry_auth::addHeaders(resp);
        resp->addHeader("Docker-Content-Digest", mount);
        resp->addHeader("Location", "/v2/" + ns + "/" + name + "/blobs/" + mount);
        return cb(resp);
    }
    const auto uuid = registry_upload::start();
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(k202Accepted);
    setUploadHeaders(resp, ns, name, uuid, 0);
    cb(resp);
}

void RegistryV2Ctrl::uploadStatus(const HttpRequestPtr& req,
                                  std::function<void(const HttpResponsePtr&)>&& cb,
                                  const std::string& ns, const std::string& name,
                                  const std::string& uuid)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "write")) return cb(registry_auth::denied());
    const auto current = registry_upload::size(uuid);
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(current < 0 ? k404NotFound : k204NoContent);
    setUploadHeaders(resp, ns, name, uuid, current < 0 ? 0 : current);
    cb(resp);
}

void RegistryV2Ctrl::patchUpload(const HttpRequestPtr& req,
                                 std::function<void(const HttpResponsePtr&)>&& cb,
                                 const std::string& ns, const std::string& name,
                                 const std::string& uuid)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "write")) return cb(registry_auth::denied());
    // Run disk write off the IO thread — for large blobs (100s of MB) the
    // ofstream write can stall the event loop long enough for postgres to drop
    // its idle connection. Capture `req` to keep the body buffer alive.
    auto cbPtr = std::make_shared<std::function<void(const HttpResponsePtr&)>>(std::move(cb));
    std::thread([ns, name, uuid, req, cbPtr]() {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k202Accepted);
        setUploadHeaders(resp, ns, name, uuid,
                         registry_upload::append(uuid, req->body()));
        (*cbPtr)(resp);
    }).detach();
}

void RegistryV2Ctrl::completeUpload(const HttpRequestPtr& req,
                                    std::function<void(const HttpResponsePtr&)>&& cb,
                                    const std::string& ns, const std::string& name,
                                    const std::string& uuid)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "write")) return cb(registry_auth::denied());
    const auto digest = req->getParameter("digest");
    if (digest.empty()) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest);
        registry_auth::addHeaders(resp);
        return cb(resp);
    }
    // Copy the (usually empty) finalize body before launching the thread so
    // the request can be freed by Drogon independently.
    auto tail = std::string(req->body());
    auto cbPtr = std::make_shared<std::function<void(const HttpResponsePtr&)>>(std::move(cb));
    // Run finalize + S3 PUT off the IO thread — the S3 upload is a blocking
    // call that can take tens of seconds for large layers.
    std::thread([ns, name, uuid, digest, tail = std::move(tail), cbPtr]() mutable {
        const auto stored = registry_upload::finalize(uuid, digest, std::move(tail));
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(stored.empty() ? k400BadRequest : k201Created);
        registry_auth::addHeaders(resp);
        if (!stored.empty()) {
            resp->addHeader("Docker-Content-Digest", stored);
            resp->addHeader("Location", "/v2/" + ns + "/" + name + "/blobs/" + stored);
        }
        (*cbPtr)(resp);
    }).detach();
}

void RegistryV2Ctrl::cancelUpload(const HttpRequestPtr& req,
                                  std::function<void(const HttpResponsePtr&)>&& cb,
                                  const std::string&, const std::string&,
                                  const std::string& uuid)
{
    auto principal = registry_auth::authenticate(req);
    if (principal.isNull()) return cb(registry_auth::challenge());
    if (!registry_auth::hasScope(principal, "write")) return cb(registry_auth::denied());
    registry_upload::cancel(uuid);
    auto resp = HttpResponse::newHttpResponse();
    resp->setStatusCode(k204NoContent);
    registry_auth::addHeaders(resp);
    cb(resp);
}
} // namespace repo

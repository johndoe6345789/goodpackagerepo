/**
 * @file S3BlobStore.cpp
 * @brief S3-backed blob storage implementation.
 */

#include "S3BlobStore.h"

#include <algorithm>
#include <future>
#include <memory>
#include <drogon/HttpAppFramework.h>

namespace repo
{

S3BlobStore::S3BlobStore(const std::string& endpoint, const std::string& bucket,
                         const std::string& accessKey)
    : endpoint_(endpoint), bucket_(bucket), accessKey_(accessKey)
{
    // Create bucket asynchronously (event loop must be running).
    LOG_TRACE << "S3: ensuring bucket '" << bucket_ << "' exists";
    auto client = drogon::HttpClient::newHttpClient(endpoint_);
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setPath("/" + bucket_);
    req->setMethod(drogon::Put);
    req->addHeader("Authorization", "Bearer " + accessKey_);
    client->sendRequest(req, [bucket](drogon::ReqResult r,
                                      const drogon::HttpResponsePtr&) {
        LOG_TRACE << "S3: bucket '" << bucket << "' result=" << (int)r;
    }, 5.0);
}

std::string S3BlobStore::sha256(const std::string& data)
{
    return sha256hex(data);
}

std::pair<std::string, size_t> S3BlobStore::store(std::string data,
                                                   const std::string& knownDigest)
{
    // Use pre-computed digest when available to avoid a second SHA256 pass over
    // a potentially large blob.
    const auto digest = knownDigest.empty() ? sha256(data) : knownDigest;
    const auto key = stripPrefix(digest);
    const auto sz = data.size();

    // Timeout scales with payload size: 30 s + 1 s per MB, capped at 600 s.
    // A fresh nextra-base-conan layer is ~500 MB and must fit inside this window.
    const auto sizeMb = static_cast<double>(sz) / (1024.0 * 1024.0);
    const auto timeout = std::min(600.0, 30.0 + sizeMb);

    // Drogon's HttpClient must be created and used on one of its own event loop
    // threads. When store() is called from a background std::thread (e.g. from
    // completeUpload), we post the PUT to the event loop via queueInLoop and
    // block on a promise so we don't race on the async TCP connect.
    auto dataPtr = std::make_shared<std::string>(std::move(data));
    auto prom = std::make_shared<std::promise<bool>>();
    auto fut = prom->get_future();

    auto ep = endpoint_;
    auto bkt = bucket_;
    auto ak = accessKey_;

    drogon::app().getLoop()->queueInLoop(
        [ep, bkt, ak, key, sz, timeout, dataPtr, prom]() mutable {
            auto client = drogon::HttpClient::newHttpClient(ep);
            auto req = drogon::HttpRequest::newHttpRequest();
            req->setPath("/" + bkt + "/" + key);
            req->setMethod(drogon::Put);
            req->addHeader("Authorization", "Bearer " + ak);
            req->setContentTypeString("application/octet-stream");
            // Move the blob into the request body — avoids a second copy of
            // potentially hundreds of MB.
            req->setBody(std::move(*dataPtr));

            client->sendRequest(req,
                [key, sz, prom](drogon::ReqResult r,
                                const drogon::HttpResponsePtr& resp) {
                    const bool ok =
                        r == drogon::ReqResult::Ok && resp &&
                        resp->statusCode() >= drogon::k200OK &&
                        resp->statusCode() < drogon::k300MultipleChoices;
                    if (!ok)
                        LOG_ERROR << "S3 PUT failed key=" << key
                                  << " size=" << sz
                                  << " result=" << static_cast<int>(r);
                    prom->set_value(ok);
                },
                timeout);
        });

    if (fut.wait_for(std::chrono::duration<double>(timeout + 5.0)) !=
        std::future_status::ready) {
        LOG_ERROR << "S3 PUT timed out key=" << key << " size=" << sz;
        return {"", 0};
    }
    if (!fut.get()) return {"", 0};
    return {digest, sz};
}

std::string S3BlobStore::read(const std::string& digest) const
{
    auto key = stripPrefix(digest);
    auto client = drogon::HttpClient::newHttpClient(endpoint_);
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setPath("/" + bucket_ + "/" + key);
    req->setMethod(drogon::Get);
    req->addHeader("Authorization", "Bearer " + accessKey_);

    auto [result, resp] = client->sendRequest(req, 30.0);
    if (result != drogon::ReqResult::Ok || !resp ||
        resp->statusCode() != drogon::k200OK) {
        return {};
    }
    return std::string(resp->body());
}

bool S3BlobStore::exists(const std::string& digest) const
{
    auto key = stripPrefix(digest);
    auto client = drogon::HttpClient::newHttpClient(endpoint_);
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setPath("/" + bucket_ + "/" + key);
    req->setMethod(drogon::Head);
    req->addHeader("Authorization", "Bearer " + accessKey_);

    auto [result, resp] = client->sendRequest(req, 5.0);
    return result == drogon::ReqResult::Ok && resp &&
           resp->statusCode() == drogon::k200OK;
}

std::string S3BlobStore::stripPrefix(const std::string& d)
{
    auto pos = d.find(':');
    return (pos != std::string::npos) ? d.substr(pos + 1) : d;
}

} // namespace repo

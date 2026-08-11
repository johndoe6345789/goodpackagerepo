/**
 * @file ProxyCache.cpp
 * @brief Pull-through cache implementation.
 */

#include "ProxyCache.h"
#include "Globals.h"

#include <drogon/HttpAppFramework.h>
#include <drogon/HttpClient.h>

#include <future>
#include <memory>

namespace repo
{

// One synchronous upstream GET on a Drogon event-loop thread, following a
// single redirect hop. Returns the 2xx body or {false}.
static ProxyResult httpGet(const std::string& base, const std::string& path)
{
    auto prom = std::make_shared<std::promise<ProxyResult>>();
    auto fut = prom->get_future();

    // Drogon's HttpClient uses only scheme://host:port from `base`; any path
    // component (e.g. https://repo1.maven.org/maven2) is otherwise dropped, so
    // fold it into the request path.
    std::string origin = base;
    std::string basePath;
    auto hostStart = base.find("://");
    hostStart = hostStart == std::string::npos ? 0 : hostStart + 3;
    auto slash = base.find('/', hostStart);
    if (slash != std::string::npos) {
        origin = base.substr(0, slash);
        basePath = base.substr(slash);
        while (!basePath.empty() && basePath.back() == '/')
            basePath.pop_back();
    }
    const std::string reqPath = basePath + path;

    drogon::app().getLoop()->queueInLoop([origin, reqPath, prom]() mutable {
        auto client = drogon::HttpClient::newHttpClient(origin);
        auto req = drogon::HttpRequest::newHttpRequest();
        req->setPath(reqPath);
        req->setMethod(drogon::Get);
        client->sendRequest(req, [prom](drogon::ReqResult r,
                                        const drogon::HttpResponsePtr& resp) {
            ProxyResult out;
            if (r == drogon::ReqResult::Ok && resp) {
                int code = resp->getStatusCode();
                if (code >= 200 && code < 300) {
                    out.ok = true;
                    out.body = std::string(resp->getBody());
                }
            }
            prom->set_value(std::move(out));
        }, 60.0);
    });

    if (fut.wait_for(std::chrono::seconds(75)) != std::future_status::ready)
        return {};
    return fut.get();
}

ProxyResult ProxyCache::fetch(const std::string& upstreamBase,
                              const std::string& path)
{
    if (!Globals::blobs)
        return {};

    // Cache key is content-addressed on the request identity, not the body, so
    // we can look it up before we have the bytes.
    const auto key = "sha256:" +
                     S3BlobStore::sha256("proxy:" + upstreamBase + path);

    if (Globals::blobs->exists(key))
        return {true, Globals::blobs->read(key)};

    auto res = httpGet(upstreamBase, path);
    if (!res.ok || res.body.empty())
        return res;

    Globals::blobs->store(res.body, key);
    return res;
}

} // namespace repo

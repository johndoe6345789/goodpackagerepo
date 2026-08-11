/**
 * @file ElasticClient.cpp
 * @brief Core ElasticClient implementation (ctor, indexDoc, search).
 */

#include "ElasticClient.h"

#include <cstdlib>

namespace repo
{

ElasticClient::ElasticClient()
{
    const char* host = std::getenv("ES_HOST");
    const char* port = std::getenv("ES_PORT");
    std::string h = host ? host : "localhost";
    std::string p = port ? port : "9200";
    baseUrl_ = "http://" + h + ":" + p;
}

void ElasticClient::sendRequest(drogon::HttpMethod method,
                                const std::string& path,
                                const std::string& body,
                                EsCallback cb)
{
    auto client = drogon::HttpClient::newHttpClient(baseUrl_);
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setMethod(method);
    req->setPath(path);
    req->setContentTypeString("application/json");
    if (!body.empty()) {
        req->setBody(body);
    }
    client->sendRequest(
        req,
        [cb = std::move(cb)](drogon::ReqResult result,
                             const drogon::HttpResponsePtr& resp) {
            if (result != drogon::ReqResult::Ok || !resp) {
                cb(false, Json{{"error", "request_failed"}});
                return;
            }
            auto code = resp->statusCode();
            bool ok = (code >= 200 && code < 300);
            Json parsed;
            try {
                parsed = Json::parse(resp->body());
            } catch (...) {
                parsed = Json{{"raw", std::string(resp->body())}};
            }
            cb(ok, parsed);
        },
        10.0);
}

void ElasticClient::indexDoc(const std::string& index,
                             const std::string& id,
                             const Json& doc, EsCallback cb)
{
    std::string path = "/" + index + "/_doc/" + id;
    sendRequest(drogon::Put, path, doc.dump(), std::move(cb));
}

void ElasticClient::search(const std::string& index,
                           const Json& query, EsCallback cb)
{
    std::string path = "/" + index + "/_search";
    sendRequest(drogon::Post, path, query.dump(), std::move(cb));
}

} // namespace repo

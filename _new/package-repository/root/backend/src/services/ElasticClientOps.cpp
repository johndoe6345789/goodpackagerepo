/**
 * @file ElasticClientOps.cpp
 * @brief Additional ElasticClient operations (delete, health, create).
 */

#include "ElasticClient.h"

namespace repo
{

void ElasticClient::deleteDoc(const std::string& index,
                              const std::string& id,
                              EsCallback cb)
{
    std::string path = "/" + index + "/_doc/" + id;
    sendRequest(drogon::Delete, path, "", std::move(cb));
}

void ElasticClient::health(EsCallback cb)
{
    sendRequest(drogon::Get, "/_cluster/health", "",
                std::move(cb));
}

void ElasticClient::createIndex(const std::string& index,
                                const Json& settings,
                                EsCallback cb)
{
    std::string path = "/" + index;
    sendRequest(drogon::Put, path, settings.dump(),
                std::move(cb));
}

} // namespace repo

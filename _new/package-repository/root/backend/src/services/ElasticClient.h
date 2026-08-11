/**
 * @file ElasticClient.h
 * @brief Lightweight Elasticsearch HTTP client for packagerepo.
 */

#pragma once

#include <drogon/HttpClient.h>
#include <nlohmann/json.hpp>

#include <functional>
#include <string>

namespace repo
{

using Json = nlohmann::json;
using EsCallback =
    std::function<void(bool ok, const Json& body)>;

/// @brief Thin async wrapper around the ES REST API.
class ElasticClient
{
  public:
    /// @brief Reads ES_HOST / ES_PORT from environment.
    ElasticClient();

    /// @brief Index (or overwrite) a document.
    /// @param index  ES index name.
    /// @param id     Document id.
    /// @param doc    JSON body to index.
    /// @param cb     Completion callback.
    void indexDoc(const std::string& index,
                  const std::string& id,
                  const Json& doc, EsCallback cb);

    /// @brief Full-text search an index.
    /// @param index  ES index name.
    /// @param query  ES query DSL body.
    /// @param cb     Completion callback with hits.
    void search(const std::string& index,
                const Json& query, EsCallback cb);

    /// @brief Delete a document by id.
    /// @param index  ES index name.
    /// @param id     Document id.
    /// @param cb     Completion callback.
    void deleteDoc(const std::string& index,
                   const std::string& id, EsCallback cb);

    /// @brief Cluster health check.
    /// @param cb  Callback with health JSON.
    void health(EsCallback cb);

    /// @brief Create an index with settings and mappings.
    /// @param index     ES index name.
    /// @param settings  Index body (settings + mappings).
    /// @param cb        Completion callback.
    void createIndex(const std::string& index,
                     const Json& settings, EsCallback cb);

  private:
    std::string baseUrl_;

    /// @brief Send a generic request to ES.
    void sendRequest(drogon::HttpMethod method,
                     const std::string& path,
                     const std::string& body,
                     EsCallback cb);
};

} // namespace repo

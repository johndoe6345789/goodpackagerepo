/**
 * @file ArtifactCtrl.h
 * @brief Package artifact CRUD endpoints.
 */

#pragma once

#include <drogon/HttpController.h>

namespace repo
{

class ArtifactCtrl : public drogon::HttpController<ArtifactCtrl>
{
  public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ArtifactCtrl::listPackages, "/v1/packages", drogon::Get,
                  "repo::OptionalAuthFilter");
    ADD_METHOD_TO(ArtifactCtrl::publish,
                  "/v1/{ns}/{name}/{version}/{variant}/blob", drogon::Put,
                  "repo::AuthFilter");
    ADD_METHOD_TO(ArtifactCtrl::fetch,
                  "/v1/{ns}/{name}/{version}/{variant}/blob", drogon::Get,
                  "repo::AuthFilter");
    ADD_METHOD_TO(ArtifactCtrl::latest, "/v1/{ns}/{name}/latest", drogon::Get,
                  "repo::AuthFilter");
    ADD_METHOD_TO(ArtifactCtrl::versions, "/v1/{ns}/{name}/versions",
                  drogon::Get, "repo::AuthFilter");
    ADD_METHOD_TO(ArtifactCtrl::setTag, "/v1/{ns}/{name}/tags/{tag}",
                  drogon::Put, "repo::AuthFilter");
    METHOD_LIST_END

    void listPackages(const drogon::HttpRequestPtr& req,
                      std::function<void(const drogon::HttpResponsePtr&)>&&);

    void publish(const drogon::HttpRequestPtr& req,
                 std::function<void(const drogon::HttpResponsePtr&)>&&,
                 const std::string& ns, const std::string& name,
                 const std::string& version, const std::string& variant);

    void fetch(const drogon::HttpRequestPtr& req,
               std::function<void(const drogon::HttpResponsePtr&)>&&,
               const std::string& ns, const std::string& name,
               const std::string& version, const std::string& variant);

    void latest(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&&,
                const std::string& ns, const std::string& name);

    void versions(const drogon::HttpRequestPtr& req,
                  std::function<void(const drogon::HttpResponsePtr&)>&&,
                  const std::string& ns, const std::string& name);

    void setTag(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&&,
                const std::string& ns, const std::string& name,
                const std::string& tag);
};

} // namespace repo

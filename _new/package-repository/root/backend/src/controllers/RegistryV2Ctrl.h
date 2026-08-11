#pragma once

#include <drogon/HttpController.h>

namespace repo
{
class RegistryV2Ctrl : public drogon::HttpController<RegistryV2Ctrl>
{
  public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(RegistryV2Ctrl::ping, "/v2", drogon::Get);
    ADD_METHOD_TO(RegistryV2Ctrl::ping, "/v2/", drogon::Get);
    ADD_METHOD_TO(RegistryV2Ctrl::ping, "/v2", drogon::Head);
    ADD_METHOD_TO(RegistryV2Ctrl::ping, "/v2/", drogon::Head);
    ADD_METHOD_TO(RegistryV2Ctrl::catalog, "/v2/_catalog", drogon::Get);
    ADD_METHOD_TO(RegistryV2Ctrl::tags, "/v2/{ns}/{name}/tags/list", drogon::Get);
    ADD_METHOD_TO(RegistryV2Ctrl::startUpload,
                  "/v2/{ns}/{name}/blobs/uploads/", drogon::Post);
    ADD_METHOD_TO(RegistryV2Ctrl::uploadStatus,
                  "/v2/{ns}/{name}/blobs/uploads/{uuid}", drogon::Get);
    ADD_METHOD_TO(RegistryV2Ctrl::uploadStatus,
                  "/v2/{ns}/{name}/blobs/uploads/{uuid}", drogon::Head);
    ADD_METHOD_TO(RegistryV2Ctrl::patchUpload,
                  "/v2/{ns}/{name}/blobs/uploads/{uuid}", drogon::Patch);
    ADD_METHOD_TO(RegistryV2Ctrl::completeUpload,
                  "/v2/{ns}/{name}/blobs/uploads/{uuid}", drogon::Put);
    ADD_METHOD_TO(RegistryV2Ctrl::cancelUpload,
                  "/v2/{ns}/{name}/blobs/uploads/{uuid}", drogon::Delete);
    ADD_METHOD_TO(RegistryV2Ctrl::headBlob,
                  "/v2/{ns}/{name}/blobs/{digest}", drogon::Head);
    ADD_METHOD_TO(RegistryV2Ctrl::getBlob,
                  "/v2/{ns}/{name}/blobs/{digest}", drogon::Get);
    ADD_METHOD_TO(RegistryV2Ctrl::headManifest,
                  "/v2/{ns}/{name}/manifests/{ref}", drogon::Head);
    ADD_METHOD_TO(RegistryV2Ctrl::getManifest,
                  "/v2/{ns}/{name}/manifests/{ref}", drogon::Get);
    ADD_METHOD_TO(RegistryV2Ctrl::putManifest,
                  "/v2/{ns}/{name}/manifests/{ref}", drogon::Put);
    ADD_METHOD_TO(RegistryV2Ctrl::deleteManifest,
                  "/v2/{ns}/{name}/manifests/{ref}", drogon::Delete);
    METHOD_LIST_END

    void ping(const drogon::HttpRequestPtr&,
              std::function<void(const drogon::HttpResponsePtr&)>&&);
    void catalog(const drogon::HttpRequestPtr&,
                 std::function<void(const drogon::HttpResponsePtr&)>&&);
    void tags(const drogon::HttpRequestPtr&,
              std::function<void(const drogon::HttpResponsePtr&)>&&,
              const std::string&, const std::string&);
    void startUpload(const drogon::HttpRequestPtr&,
                     std::function<void(const drogon::HttpResponsePtr&)>&&,
                     const std::string&, const std::string&);
    void uploadStatus(const drogon::HttpRequestPtr&,
                      std::function<void(const drogon::HttpResponsePtr&)>&&,
                      const std::string&, const std::string&, const std::string&);
    void patchUpload(const drogon::HttpRequestPtr&,
                     std::function<void(const drogon::HttpResponsePtr&)>&&,
                     const std::string&, const std::string&, const std::string&);
    void completeUpload(const drogon::HttpRequestPtr&,
                        std::function<void(const drogon::HttpResponsePtr&)>&&,
                        const std::string&, const std::string&,
                        const std::string&);
    void cancelUpload(const drogon::HttpRequestPtr&,
                      std::function<void(const drogon::HttpResponsePtr&)>&&,
                      const std::string&, const std::string&,
                      const std::string&);
    void headBlob(const drogon::HttpRequestPtr&,
                  std::function<void(const drogon::HttpResponsePtr&)>&&,
                  const std::string&, const std::string&, const std::string&);
    void getBlob(const drogon::HttpRequestPtr&,
                 std::function<void(const drogon::HttpResponsePtr&)>&&,
                 const std::string&, const std::string&, const std::string&);
    void headManifest(const drogon::HttpRequestPtr&,
                      std::function<void(const drogon::HttpResponsePtr&)>&&,
                      const std::string&, const std::string&, const std::string&);
    void getManifest(const drogon::HttpRequestPtr&,
                     std::function<void(const drogon::HttpResponsePtr&)>&&,
                     const std::string&, const std::string&, const std::string&);
    void putManifest(const drogon::HttpRequestPtr&,
                     std::function<void(const drogon::HttpResponsePtr&)>&&,
                     const std::string&, const std::string&, const std::string&);
    void deleteManifest(const drogon::HttpRequestPtr&,
                        std::function<void(const drogon::HttpResponsePtr&)>&&,
                        const std::string&, const std::string&,
                        const std::string&);
};
} // namespace repo

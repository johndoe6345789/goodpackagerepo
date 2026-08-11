/**
 * @file HealthCtrl.h
 * @brief Health check, schema, and stats endpoints.
 */

#pragma once

#include "../services/Globals.h"
#include "../services/PgArtifactQuery.h"

#include <drogon/HttpController.h>

namespace repo
{

class HealthCtrl : public drogon::HttpController<HealthCtrl>
{
  public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(HealthCtrl::health, "/health", drogon::Get);
    ADD_METHOD_TO(HealthCtrl::schema, "/schema", drogon::Get);
    ADD_METHOD_TO(HealthCtrl::stats, "/stats", drogon::Get);
    METHOD_LIST_END

    void health(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value out;
        out["status"] = "healthy";
        cb(drogon::HttpResponse::newHttpJsonResponse(out));
    }

    void schema(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        auto r = drogon::HttpResponse::newHttpResponse();
        r->setContentTypeCode(drogon::CT_APPLICATION_JSON);
        r->setBody(Globals::schemaJson);
        cb(r);
    }

    void stats(const drogon::HttpRequestPtr& req,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value out;
        out["ok"] = true;
        out["total_artifacts"] = (Json::Int64)pg_artifact::count();
        cb(drogon::HttpResponse::newHttpJsonResponse(out));
    }
};

} // namespace repo

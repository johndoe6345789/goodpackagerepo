/**
 * @file AdminCtrl.h
 * @brief Admin-only configuration inspection via PostgreSQL.
 */

#pragma once

#include "../services/PgConfigStore.h"

#include <drogon/HttpController.h>

namespace repo
{

class AdminCtrl : public drogon::HttpController<AdminCtrl>
{
  public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AdminCtrl::config, "/admin/config", drogon::Get,
                  "repo::AuthFilter");
    ADD_METHOD_TO(AdminCtrl::entities, "/admin/entities", drogon::Get,
                  "repo::AuthFilter");
    ADD_METHOD_TO(AdminCtrl::routes, "/admin/routes", drogon::Get,
                  "repo::AuthFilter");
    ADD_METHOD_TO(AdminCtrl::blobStoresEp, "/admin/blob-stores", drogon::Get,
                  "repo::AuthFilter");
    ADD_METHOD_TO(AdminCtrl::scopesEp, "/admin/auth/scopes", drogon::Get,
                  "repo::AuthFilter");
    ADD_METHOD_TO(AdminCtrl::featuresEp, "/admin/features", drogon::Get,
                  "repo::AuthFilter");
    METHOD_LIST_END

    void config(const drogon::HttpRequestPtr&,
                std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value o;
        o["ok"] = true;
        o["config"]["features"] = PgConfigStore::features();
        o["config"]["scopes"] = PgConfigStore::scopes();
        o["config"]["blob_stores"] = PgConfigStore::blobStores();
        cb(drogon::HttpResponse::newHttpJsonResponse(o));
    }

    void entities(const drogon::HttpRequestPtr&,
                  std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value o;
        o["ok"] = true;
        o["entities"] = Json::arrayValue;
        cb(drogon::HttpResponse::newHttpJsonResponse(o));
    }

    void routes(const drogon::HttpRequestPtr&,
                std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value o;
        o["ok"] = true;
        o["routes"] = Json::arrayValue;
        cb(drogon::HttpResponse::newHttpJsonResponse(o));
    }

    void blobStoresEp(const drogon::HttpRequestPtr&,
                      std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value o;
        o["ok"] = true;
        o["blob_stores"] = PgConfigStore::blobStores();
        cb(drogon::HttpResponse::newHttpJsonResponse(o));
    }

    void scopesEp(const drogon::HttpRequestPtr&,
                  std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value o;
        o["ok"] = true;
        o["scopes"] = PgConfigStore::scopes();
        cb(drogon::HttpResponse::newHttpJsonResponse(o));
    }

    void featuresEp(const drogon::HttpRequestPtr&,
                    std::function<void(const drogon::HttpResponsePtr&)>&& cb)
    {
        Json::Value o;
        o["ok"] = true;
        o["features"] = PgConfigStore::features();
        cb(drogon::HttpResponse::newHttpJsonResponse(o));
    }
};

} // namespace repo

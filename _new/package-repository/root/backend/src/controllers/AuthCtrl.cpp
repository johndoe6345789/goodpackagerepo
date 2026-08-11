/**
 * @file AuthCtrl.cpp
 * @brief Authentication endpoint implementations.
 */

#include "AuthCtrl.h"
#include "../services/Globals.h"
#include "../services/JwtService.h"
#include "../services/PgUserStore.h"

using namespace drogon;

namespace repo
{

void AuthCtrl::login(const HttpRequestPtr& req,
                     std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto json = req->getJsonObject();
    if (!json || !(*json)["username"].isString() ||
        !(*json)["password"].isString()) {
        Json::Value err;
        err["error"]["code"] = "INVALID_REQUEST";
        err["error"]["message"] = "Missing credentials";
        auto r = HttpResponse::newHttpJsonResponse(err);
        r->setStatusCode(k400BadRequest);
        cb(r);
        return;
    }

    auto user = PgUserStore::verify((*json)["username"].asString(),
                                    (*json)["password"].asString());

    if (user.isNull()) {
        Json::Value err;
        err["error"]["code"] = "UNAUTHORIZED";
        err["error"]["message"] = "Invalid credentials";
        auto r = HttpResponse::newHttpJsonResponse(err);
        r->setStatusCode(k401Unauthorized);
        cb(r);
        return;
    }

    auto token = createJwt(user["username"].asString(), user["scopes"],
                           Globals::jwtSecret);

    Json::Value out;
    out["ok"] = true;
    out["token"] = token;
    out["user"] = user;
    cb(HttpResponse::newHttpJsonResponse(out));
}

void AuthCtrl::me(const HttpRequestPtr& req,
                  std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto p = req->attributes()->get<Json::Value>("principal");
    Json::Value out;
    out["ok"] = true;
    out["user"]["username"] = p["sub"];
    out["user"]["scopes"] = p["scopes"];
    cb(HttpResponse::newHttpJsonResponse(out));
}

void AuthCtrl::changePassword(const HttpRequestPtr& req,
                              std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto p = req->attributes()->get<Json::Value>("principal");
    auto json = req->getJsonObject();
    if (!json || !(*json)["old_password"].isString() ||
        !(*json)["new_password"].isString()) {
        Json::Value err;
        err["error"]["code"] = "INVALID_REQUEST";
        err["error"]["message"] = "Missing passwords";
        auto r = HttpResponse::newHttpJsonResponse(err);
        r->setStatusCode(k400BadRequest);
        cb(r);
        return;
    }

    bool ok = PgUserStore::changePass(p["sub"].asString(),
                                      (*json)["old_password"].asString(),
                                      (*json)["new_password"].asString());

    Json::Value out;
    if (ok) {
        out["ok"] = true;
        out["message"] = "Password changed";
    } else {
        out["error"]["code"] = "INVALID_PASSWORD";
        out["error"]["message"] = "Old password incorrect";
    }
    auto r = HttpResponse::newHttpJsonResponse(out);
    if (!ok)
        r->setStatusCode(k401Unauthorized);
    cb(r);
}

} // namespace repo

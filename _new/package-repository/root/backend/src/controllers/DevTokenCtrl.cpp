/**
 * @file DevTokenCtrl.cpp
 * @brief Dev token creation endpoint.
 *
 * Gated on the default dev secret. Returns 403 in
 * production when a real secret is configured.
 */

#include "DevTokenCtrl.h"
#include "DevTokenUtil.h"
#include "../services/Globals.h"
#include "../services/JwtService.h"

#include <drogon/HttpResponse.h>

using namespace drogon;

namespace repo
{

void DevTokenCtrl::create(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    if (!isDevMode()) {
        cb(forbiddenResp());
        return;
    }

    auto json = req->getJsonObject();
    std::string sub = "dev";
    Json::Value scopes(Json::arrayValue);

    if (json && (*json)["sub"].isString())
        sub = (*json)["sub"].asString();

    if (json && (*json)["scopes"].isArray()) {
        scopes = (*json)["scopes"];
    } else {
        scopes.append("read");
        scopes.append("write");
        scopes.append("admin");
    }

    int64_t hours = kDevExpHours;
    if (json && (*json)["exp_hours"].isInt64())
        hours = (*json)["exp_hours"].asInt64();

    auto token = createJwt(sub, scopes,
                           Globals::jwtSecret, hours);

    Json::Value out;
    out["ok"] = true;
    out["token"] = token;
    out["sub"] = sub;
    out["scopes"] = scopes;
    out["expires_in_hours"] = (Json::Int64)hours;
    cb(HttpResponse::newHttpJsonResponse(out));
}

} // namespace repo

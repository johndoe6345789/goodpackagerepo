/**
 * @file DevTokenVerify.cpp
 * @brief Dev token verification endpoint.
 */

#include "DevTokenCtrl.h"
#include "DevTokenUtil.h"
#include "../services/Globals.h"
#include "../services/JwtVerify.h"

#include <drogon/HttpResponse.h>

using namespace drogon;

namespace repo
{

void DevTokenCtrl::verify(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    if (!isDevMode()) {
        cb(forbiddenResp());
        return;
    }

    auto json = req->getJsonObject();
    if (!json || !(*json)["token"].isString()) {
        Json::Value err;
        err["error"]["code"] = "INVALID_REQUEST";
        err["error"]["message"] = "Missing token field";
        auto r = HttpResponse::newHttpJsonResponse(err);
        r->setStatusCode(k400BadRequest);
        cb(r);
        return;
    }

    auto claims = verifyJwt(
        (*json)["token"].asString(),
        Globals::jwtSecret);

    Json::Value out;
    out["ok"] = !claims.isNull();
    if (!claims.isNull())
        out["claims"] = claims;
    else
        out["error"] = "Invalid or expired token";
    cb(HttpResponse::newHttpJsonResponse(out));
}

} // namespace repo

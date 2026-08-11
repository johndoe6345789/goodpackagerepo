/**
 * @file AuthFilter.cpp
 * @brief JWT authentication filter implementations.
 */

#include "AuthFilter.h"
#include "../services/Globals.h"
#include "../services/JwtVerify.h"

#include <drogon/HttpResponse.h>

using namespace drogon;

namespace repo
{

static Json::Value extractPrincipal(const HttpRequestPtr& req)
{
    auto auth = req->getHeader("Authorization");
    if (auth.substr(0, 7) != "Bearer ")
        return {};
    return verifyJwt(auth.substr(7), Globals::jwtSecret);
}

static HttpResponsePtr unauthorized(const std::string& msg)
{
    Json::Value err;
    err["error"]["code"] = "UNAUTHORIZED";
    err["error"]["message"] = msg;
    auto resp = HttpResponse::newHttpJsonResponse(err);
    resp->setStatusCode(k401Unauthorized);
    return resp;
}

void AuthFilter::doFilter(const HttpRequestPtr& req, FilterCallback&& cb,
                          FilterChainCallback&& ccb)
{
    auto principal = extractPrincipal(req);
    if (principal.isNull()) {
        cb(unauthorized("Missing or invalid token"));
        return;
    }
    req->attributes()->insert("principal", principal);
    ccb();
}

void OptionalAuthFilter::doFilter(const HttpRequestPtr& req,
                                  FilterCallback&& cb,
                                  FilterChainCallback&& ccb)
{
    auto principal = extractPrincipal(req);
    if (!principal.isNull()) {
        req->attributes()->insert("principal", principal);
    } else {
        Json::Value anon;
        anon["sub"] = "anonymous";
        anon["scopes"].append("read");
        req->attributes()->insert("principal", anon);
    }
    ccb();
}

} // namespace repo

#pragma once

#include "Globals.h"
#include "JwtVerify.h"
#include "PgUserStore.h"

#include <drogon/HttpResponse.h>
#include <drogon/utils/Utilities.h>

namespace repo::registry_auth
{
inline void addHeaders(const drogon::HttpResponsePtr& resp)
{
    resp->addHeader("Docker-Distribution-Api-Version", "registry/2.0");
}

inline bool hasScope(const Json::Value& p, const std::string& scope)
{
    for (const auto& s : p["scopes"]) {
        if (s.asString() == scope || s.asString() == "admin") return true;
    }
    return false;
}

inline Json::Value authenticate(const drogon::HttpRequestPtr& req)
{
    const auto auth = req->getHeader("Authorization");
    if (auth.rfind("Bearer ", 0) == 0) {
        return verifyJwt(auth.substr(7), Globals::jwtSecret);
    }
    if (auth.rfind("Basic ", 0) != 0) return Json::nullValue;
    const auto raw = drogon::utils::base64Decode(auth.substr(6));
    const auto pos = raw.find(':');
    if (pos == std::string::npos) return Json::nullValue;
    return PgUserStore::verify(raw.substr(0, pos), raw.substr(pos + 1));
}

inline drogon::HttpResponsePtr challenge()
{
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->setStatusCode(drogon::k401Unauthorized);
    addHeaders(resp);
    resp->addHeader("WWW-Authenticate", "Basic realm=\"packagerepo\"");
    return resp;
}

inline drogon::HttpResponsePtr denied()
{
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->setStatusCode(drogon::k403Forbidden);
    addHeaders(resp);
    return resp;
}
} // namespace repo::registry_auth

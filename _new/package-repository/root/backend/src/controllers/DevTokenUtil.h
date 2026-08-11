/**
 * @file DevTokenUtil.h
 * @brief Shared helpers for dev token endpoints.
 */

#pragma once

#include "../services/Globals.h"

#include <drogon/HttpResponse.h>

namespace repo
{

inline constexpr const char* kDevSecret = "dev-secret-key";
inline constexpr int64_t kDevExpHours = 8760; // 1 year

/// @brief True when using the default dev JWT secret.
inline bool isDevMode()
{
    return Globals::jwtSecret == kDevSecret;
}

/// @brief 403 response for non-dev environments.
inline drogon::HttpResponsePtr forbiddenResp()
{
    Json::Value err;
    err["error"]["code"] = "FORBIDDEN";
    err["error"]["message"] =
        "Dev tokens disabled (non-default JWT secret)";
    auto r =
        drogon::HttpResponse::newHttpJsonResponse(err);
    r->setStatusCode(drogon::k403Forbidden);
    return r;
}

} // namespace repo

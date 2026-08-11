/**
 * @file JwtService.h
 * @brief Minimal HS256 JWT creation using OpenSSL.
 *
 * Verification is in JwtVerify.h.
 */

#pragma once

#include "HmacUtil.h"

#include <json/json.h>

#include <chrono>
#include <cstdint>
#include <string>

namespace repo
{

/// @brief Create a JWT with sub, scopes, and exp claims.
inline std::string createJwt(
    const std::string& sub,
    const Json::Value& scopes,
    const std::string& secret,
    int64_t expHours = 24)
{
    auto now = std::chrono::system_clock::now();
    auto exp = now + std::chrono::hours(expHours);
    auto expSec =
        std::chrono::duration_cast<std::chrono::seconds>(
            exp.time_since_epoch())
            .count();

    auto header = b64url(R"({"alg":"HS256","typ":"JWT"})");

    Json::Value pay;
    pay["sub"] = sub;
    pay["scopes"] = scopes;
    pay["exp"] = (Json::Int64)expSec;
    Json::StreamWriterBuilder w;
    w["indentation"] = "";
    auto payload = b64url(Json::writeString(w, pay));

    auto sig = hmacSign(header + "." + payload, secret);
    return header + "." + payload + "." + sig;
}

} // namespace repo

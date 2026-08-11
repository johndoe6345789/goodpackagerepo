/**
 * @file JwtVerify.h
 * @brief JWT verification (HS256) using OpenSSL.
 */

#pragma once

#include "JwtService.h"

#include <drogon/utils/Utilities.h>
#include <json/json.h>

#include <chrono>
#include <sstream>
#include <string>

namespace repo
{

/// @brief Verify JWT, return payload or empty on failure.
inline Json::Value verifyJwt(const std::string& token,
                             const std::string& secret)
{
    auto d1 = token.find('.');
    auto d2 = token.find('.', d1 + 1);
    if (d1 == std::string::npos || d2 == std::string::npos)
        return {};

    auto hdr = token.substr(0, d1);
    auto pay = token.substr(d1 + 1, d2 - d1 - 1);
    auto sig = token.substr(d2 + 1);

    if (hmacSign(hdr + "." + pay, secret) != sig)
        return {};

    // Pad base64url back to base64
    auto padded = pay;
    for (auto& c : padded) {
        if (c == '-')
            c = '+';
        else if (c == '_')
            c = '/';
    }
    while (padded.size() % 4)
        padded += '=';

    auto json = drogon::utils::base64Decode(padded);
    Json::Value root;
    Json::CharReaderBuilder rb;
    std::istringstream ss(json);
    Json::parseFromStream(rb, ss, &root, nullptr);

    auto now = std::chrono::duration_cast<std::chrono::seconds>(
                   std::chrono::system_clock::now().time_since_epoch())
                   .count();
    if (root["exp"].asInt64() < now)
        return {};

    return root;
}

} // namespace repo

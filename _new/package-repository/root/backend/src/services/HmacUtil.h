/**
 * @file HmacUtil.h
 * @brief HMAC-SHA256 signing using OpenSSL 3.x EVP MAC API.
 */

#pragma once

#include <drogon/utils/Utilities.h>
#include <openssl/evp.h>
#include <openssl/params.h>

#include <algorithm>
#include <string>

namespace repo
{

/// @brief Base64url encode (RFC 4648 sec 5).
inline std::string b64url(const std::string& in)
{
    auto b = drogon::utils::base64Encode(in);
    for (auto& c : b) {
        if (c == '+')
            c = '-';
        else if (c == '/')
            c = '_';
    }
    b.erase(std::remove(b.begin(), b.end(), '='), b.end());
    return b;
}

/// @brief Sign data with HMAC-SHA256, return base64url.
inline std::string hmacSign(
    const std::string& data, const std::string& secret)
{
    unsigned char out[EVP_MAX_MD_SIZE];
    size_t len = 0;
    auto* mac = EVP_MAC_fetch(nullptr, "HMAC", nullptr);
    auto* ctx = EVP_MAC_CTX_new(mac);
    OSSL_PARAM params[] = {
        OSSL_PARAM_construct_utf8_string(
            "digest", (char*)"SHA256", 0),
        OSSL_PARAM_construct_end()};
    EVP_MAC_init(
        ctx, (const unsigned char*)secret.data(),
        secret.size(), params);
    EVP_MAC_update(
        ctx, (const unsigned char*)data.data(),
        data.size());
    EVP_MAC_final(ctx, out, &len, sizeof(out));
    EVP_MAC_CTX_free(ctx);
    EVP_MAC_free(mac);
    return b64url(std::string((char*)out, len));
}

} // namespace repo

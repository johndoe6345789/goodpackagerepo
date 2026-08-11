/**
 * @file DigestUtil.h
 * @brief SHA256 digest helper using OpenSSL 3.x EVP API.
 */

#pragma once

#include <openssl/evp.h>

#include <iomanip>
#include <sstream>
#include <string>

namespace repo
{

/// @brief Compute SHA256 hex digest with "sha256:" prefix.
inline std::string sha256hex(const std::string& data)
{
    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int len = 0;
    auto* ctx = EVP_MD_CTX_new();
    EVP_DigestInit_ex(ctx, EVP_sha256(), nullptr);
    EVP_DigestUpdate(ctx, data.data(), data.size());
    EVP_DigestFinal_ex(ctx, hash, &len);
    EVP_MD_CTX_free(ctx);
    std::ostringstream ss;
    ss << "sha256:";
    for (unsigned int i = 0; i < len; ++i)
        ss << std::hex << std::setfill('0')
           << std::setw(2) << (int)hash[i];
    return ss.str();
}

} // namespace repo

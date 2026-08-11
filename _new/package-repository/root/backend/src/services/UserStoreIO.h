/**
 * @file UserStoreIO.h
 * @brief Persistence helpers (load/save/seed) for UserStore.
 *
 * Included by UserStore.h — not meant for direct use.
 */

#pragma once

#include "S3BlobStore.h"

#include <json/json.h>
#include <openssl/rand.h>

#include <filesystem>
#include <fstream>
#include <string>

namespace repo
{
namespace user_io
{

/// @brief Generate a cryptographic random salt (hex).
inline std::string makeSalt()
{
    unsigned char buf[16];
    RAND_bytes(buf, sizeof(buf));
    std::string out;
    for (auto b : buf)
        out += "0123456789abcdef"[b & 0xf];
    return out;
}

/// @brief Hash password with salt via SHA256.
inline std::string hashPass(const std::string& pass, const std::string& salt)
{
    return S3BlobStore::sha256(salt + ":" + pass);
}

/// @brief Load users from JSON file.
inline void loadUsers(const std::filesystem::path& path,
                      std::unordered_map<std::string, Json::Value>& users)
{
    if (!std::filesystem::exists(path))
        return;
    std::ifstream f(path);
    Json::Value root;
    Json::CharReaderBuilder rb;
    Json::parseFromStream(rb, f, &root, nullptr);
    for (const auto& k : root.getMemberNames())
        users[k] = root[k];
}

/// @brief Save users to JSON file.
inline void saveUsers(const std::filesystem::path& path,
                      const std::unordered_map<std::string, Json::Value>& users)
{
    namespace fs = std::filesystem;
    fs::create_directories(path.parent_path());
    Json::Value root(Json::objectValue);
    for (const auto& [k, v] : users)
        root[k] = v;
    std::ofstream f(path);
    Json::StreamWriterBuilder wb;
    f << Json::writeString(wb, root);
}

} // namespace user_io
} // namespace repo

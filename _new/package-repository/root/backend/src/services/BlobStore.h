/**
 * @file BlobStore.h
 * @brief SHA256 content-addressed filesystem blob storage.
 */

#pragma once

#include "DigestUtil.h"

#include <cstdio>
#include <filesystem>
#include <fstream>
#include <string>

namespace repo
{

namespace fs = std::filesystem;

class BlobStore
{
  public:
    explicit BlobStore(const fs::path& root) : root_(root)
    {
        fs::create_directories(root_);
    }

    /// @brief Compute SHA256 digest of data.
    static std::string sha256(const std::string& data)
    {
        return sha256hex(data);
    }

    /// @brief Get filesystem path for a digest.
    fs::path blobPath(const std::string& digest) const
    {
        auto hex = stripPrefix(digest);
        return root_ / hex.substr(0, 2) / hex.substr(2, 2) / hex;
    }

    /// @brief Store blob, return {digest, size}.
    std::pair<std::string, size_t> store(const std::string& data)
    {
        auto digest = sha256(data);
        auto path = blobPath(digest);
        if (!fs::exists(path)) {
            fs::create_directories(path.parent_path());
            std::ofstream f(path, std::ios::binary);
            f.write(data.data(), (long)data.size());
        }
        return {digest, data.size()};
    }

    /// @brief Read blob by digest, empty if missing.
    std::string read(const std::string& digest) const
    {
        auto path = blobPath(digest);
        if (!fs::exists(path))
            return {};
        std::ifstream f(path, std::ios::binary);
        return {std::istreambuf_iterator<char>(f),
                std::istreambuf_iterator<char>()};
    }

    /// @brief Check if blob exists.
    bool exists(const std::string& digest) const
    {
        return fs::exists(blobPath(digest));
    }

  private:
    fs::path root_;

    static std::string stripPrefix(const std::string& d)
    {
        auto pos = d.find(':');
        return (pos != std::string::npos) ? d.substr(pos + 1) : d;
    }
};

} // namespace repo

#pragma once

#include "Globals.h"

#include <drogon/utils/Utilities.h>

#include <filesystem>
#include <fstream>
#include <string_view>

namespace repo::registry_upload
{
namespace fs = std::filesystem;

inline fs::path root()
{
    auto dir = fs::temp_directory_path() / "packagerepo-registry";
    fs::create_directories(dir);
    return dir;
}

inline fs::path pathFor(const std::string& uuid) { return root() / uuid; }

inline std::string start()
{
    auto uuid = drogon::utils::getUuid();
    std::ofstream(pathFor(uuid), std::ios::binary);
    return uuid;
}

inline void cancel(const std::string& uuid) { fs::remove(pathFor(uuid)); }

inline int64_t size(const std::string& uuid)
{
    auto path = pathFor(uuid);
    return fs::exists(path) ? (int64_t)fs::file_size(path) : -1;
}

// Accept string_view so callers can pass Drogon's request body directly
// without making an intermediate copy of potentially large blobs.
inline int64_t append(const std::string& uuid, std::string_view chunk)
{
    std::ofstream(pathFor(uuid), std::ios::binary | std::ios::app).write(
        chunk.data(), (long)chunk.size());
    return size(uuid);
}

inline std::string finalize(const std::string& uuid, const std::string& digest,
                            std::string tail)
{
    if (size(uuid) < 0) return {};
    if (!tail.empty()) append(uuid, tail);
    // Free tail before the large file read so peak memory = file size only.
    tail.clear();
    tail.shrink_to_fit();
    std::ifstream f(pathFor(uuid), std::ios::binary);
    std::string data{std::istreambuf_iterator<char>(f), {}};
    f.close();
    const auto actual = S3BlobStore::sha256(data);
    if (actual != digest) {
        fs::remove(pathFor(uuid));
        return {};
    }
    // Pass the pre-verified digest and move the blob into the store to avoid
    // a redundant SHA256 pass and a second copy of the blob body.
    // Only remove the staging file if the store succeeds; an empty first element
    // signals S3 failure so buildx can retry without us advertising a missing blob.
    auto stored = Globals::blobs->store(std::move(data), actual);
    if (stored.first.empty()) return {};
    fs::remove(pathFor(uuid));
    return stored.first;
}
} // namespace repo::registry_upload

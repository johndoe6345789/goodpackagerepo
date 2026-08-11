/**
 * @file MetaStoreIO.h
 * @brief Persistence helpers (load/save) for MetaStore.
 *
 * Included by MetaStore.h — not meant for direct use.
 */

#pragma once

#include <json/json.h>

#include <filesystem>
#include <fstream>
#include <string>
#include <unordered_map>

namespace repo
{
namespace meta_io
{

/// @brief Load metadata from JSON file.
inline void load(const std::filesystem::path& path,
                 std::unordered_map<std::string, Json::Value>& data)
{
    if (!std::filesystem::exists(path))
        return;
    std::ifstream f(path);
    Json::Value root;
    Json::CharReaderBuilder rb;
    Json::parseFromStream(rb, f, &root, nullptr);
    for (const auto& k : root.getMemberNames())
        data[k] = root[k];
}

/// @brief Save metadata to JSON file.
inline void save(const std::filesystem::path& path,
                 const std::unordered_map<std::string, Json::Value>& data)
{
    std::filesystem::create_directories(path.parent_path());
    Json::Value root(Json::objectValue);
    for (const auto& [k, v] : data)
        root[k] = v;
    Json::StreamWriterBuilder wb;
    wb["indentation"] = "  ";
    std::ofstream f(path);
    f << Json::writeString(wb, root);
}

} // namespace meta_io
} // namespace repo

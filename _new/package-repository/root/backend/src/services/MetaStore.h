/**
 * @file MetaStore.h
 * @brief Persistent JSON-backed key-value metadata store.
 */

#pragma once

#include "MetaStoreIO.h"

#include <json/json.h>

#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

namespace repo
{

class MetaStore
{
  public:
    explicit MetaStore(const std::filesystem::path& path) : path_(path)
    {
        meta_io::load(path_, data_);
    }

    Json::Value get(const std::string& key) const
    {
        std::lock_guard lk(mu_);
        auto it = data_.find(key);
        return (it != data_.end()) ? it->second : Json::nullValue;
    }

    void put(const std::string& key, const Json::Value& val)
    {
        std::lock_guard lk(mu_);
        data_[key] = val;
        meta_io::save(path_, data_);
    }

    /// @brief Put only if key is absent.
    bool casPut(const std::string& key, const Json::Value& v)
    {
        std::lock_guard lk(mu_);
        if (data_.count(key))
            return false;
        data_[key] = v;
        meta_io::save(path_, data_);
        return true;
    }

    void del(const std::string& key)
    {
        std::lock_guard lk(mu_);
        data_.erase(key);
        meta_io::save(path_, data_);
    }

    /// @brief List keys matching prefix.
    std::vector<std::string> keys(const std::string& prefix = "",
                                  size_t limit = 100) const
    {
        std::lock_guard lk(mu_);
        std::vector<std::string> out;
        for (const auto& [k, _] : data_) {
            if (prefix.empty() || k.starts_with(prefix))
                out.push_back(k);
            if (out.size() >= limit)
                break;
        }
        return out;
    }

    size_t count() const
    {
        std::lock_guard lk(mu_);
        return data_.size();
    }

  private:
    std::filesystem::path path_;
    std::unordered_map<std::string, Json::Value> data_;
    mutable std::mutex mu_;
};

} // namespace repo

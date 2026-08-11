/**
 * @file IndexStore.h
 * @brief In-memory version index with sorted retrieval.
 */

#pragma once

#include <json/json.h>

#include <algorithm>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

namespace repo
{

class IndexStore
{
  public:
    /// @brief Add a version entry to the index.
    void upsert(const std::string& key, const Json::Value& entry)
    {
        std::lock_guard lk(mu_);
        idx_[key].push_back(entry);
        std::sort(idx_[key].begin(), idx_[key].end(),
                  [](const Json::Value& a, const Json::Value& b) {
                      return a["version"].asString() > b["version"].asString();
                  });
    }

    /// @brief Query entries for an index key.
    std::vector<Json::Value> query(const std::string& key,
                                   size_t limit = 100) const
    {
        std::lock_guard lk(mu_);
        auto it = idx_.find(key);
        if (it == idx_.end())
            return {};

        auto n = std::min(limit, it->second.size());
        return {it->second.begin(), it->second.begin() + (long)n};
    }

    /// @brief Remove all entries for a key.
    void remove(const std::string& key)
    {
        std::lock_guard lk(mu_);
        idx_.erase(key);
    }

  private:
    mutable std::mutex mu_;
    std::unordered_map<std::string, std::vector<Json::Value>> idx_;
};

} // namespace repo

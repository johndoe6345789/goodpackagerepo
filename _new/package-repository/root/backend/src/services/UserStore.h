/**
 * @file UserStore.h
 * @brief JSON-persisted user store with SHA256 password
 *        hashing.
 */

#pragma once

#include "UserStoreIO.h"

#include <json/json.h>

#include <filesystem>
#include <mutex>
#include <string>
#include <unordered_map>

namespace repo
{

class UserStore
{
  public:
    explicit UserStore(const std::filesystem::path& path) : path_(path)
    {
        user_io::loadUsers(path_, users_);
        seedAdmin();
    }

    /// @brief Verify credentials. Returns user JSON or
    /// null.
    Json::Value verify(const std::string& user, const std::string& pass) const
    {
        std::lock_guard lk(mu_);
        auto it = users_.find(user);
        if (it == users_.end())
            return Json::nullValue;
        auto hash = user_io::hashPass(pass, it->second["salt"].asString());
        if (hash != it->second["hash"].asString())
            return Json::nullValue;
        Json::Value out;
        out["username"] = user;
        out["scopes"] = it->second["scopes"];
        return out;
    }

    /// @brief Change password. Returns true on success.
    bool changePass(const std::string& user, const std::string& oldP,
                    const std::string& newP)
    {
        if (verify(user, oldP).isNull())
            return false;
        std::lock_guard lk(mu_);
        auto salt = user_io::makeSalt();
        users_[user]["salt"] = salt;
        users_[user]["hash"] = user_io::hashPass(newP, salt);
        user_io::saveUsers(path_, users_);
        return true;
    }

  private:
    std::filesystem::path path_;
    std::unordered_map<std::string, Json::Value> users_;
    mutable std::mutex mu_;

    void seedAdmin()
    {
        std::lock_guard lk(mu_);
        if (users_.count("admin"))
            return;
        auto salt = user_io::makeSalt();
        Json::Value u;
        u["salt"] = salt;
        u["hash"] = user_io::hashPass("admin", salt);
        u["scopes"].append("read");
        u["scopes"].append("write");
        u["scopes"].append("admin");
        users_["admin"] = u;
        user_io::saveUsers(path_, users_);
    }
};

} // namespace repo

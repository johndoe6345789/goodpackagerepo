/**
 * @file PgUserStore.h
 * @brief PostgreSQL-backed user store with password hashing.
 */

#pragma once

#include "DbPool.h"
#include "S3BlobStore.h"

#include <json/json.h>

#include <string>

namespace repo
{

class PgUserStore
{
  public:
    /// @brief Create users table and seed admin if needed.
    static void init()
    {
        auto db = DbPool::get();
        auto r = db->execSqlSync("SELECT id FROM users "
                                 "WHERE username='admin'");
        if (r.empty()) {
            auto salt = makeSalt();
            auto hash = hashPass("admin", salt);
            db->execSqlSync("INSERT INTO users "
                            "(username,pass_hash,pass_salt,scopes) "
                            "VALUES ($1,$2,$3,$4)",
                            "admin", hash, salt, "read,write,admin");
        }
    }

    /// @brief Verify credentials, return user JSON or null.
    static Json::Value verify(const std::string& user, const std::string& pass)
    {
        auto r = DbPool::get()->execSqlSync("SELECT pass_hash,pass_salt,scopes "
                                            "FROM users WHERE username=$1",
                                            user);
        if (r.empty())
            return Json::nullValue;

        auto hash = hashPass(pass, r[0]["pass_salt"].as<std::string>());
        if (hash != r[0]["pass_hash"].as<std::string>())
            return Json::nullValue;

        Json::Value out;
        out["username"] = user;
        auto scopes = r[0]["scopes"].as<std::string>();
        for (size_t p = 0, n; p < scopes.size(); p = n + 1) {
            n = scopes.find(',', p);
            if (n == std::string::npos)
                n = scopes.size();
            out["scopes"].append(scopes.substr(p, n - p));
        }
        return out;
    }

    /// @brief Change password. Returns true on success.
    static bool changePass(const std::string& user, const std::string& oldP,
                           const std::string& newP)
    {
        if (verify(user, oldP).isNull())
            return false;
        auto salt = makeSalt();
        auto hash = hashPass(newP, salt);
        DbPool::get()->execSqlSync(
            "UPDATE users SET pass_hash=$1, pass_salt=$2, "
            "updated_at=now() WHERE username=$3",
            hash, salt, user);
        return true;
    }

  private:
    static std::string makeSalt()
    {
        char buf[16];
        for (auto& c : buf)
            c = "abcdef0123456789"[rand() % 16];
        return {buf, 16};
    }

    static std::string hashPass(const std::string& pass,
                                const std::string& salt)
    {
        return S3BlobStore::sha256(salt + ":" + pass);
    }
};

} // namespace repo

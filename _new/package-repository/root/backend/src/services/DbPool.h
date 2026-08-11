/**
 * @file DbPool.h
 * @brief PostgreSQL connection pool via Drogon's ORM client.
 */

#pragma once

#include <drogon/orm/DbClient.h>

#include <memory>
#include <string>

namespace repo
{

/// @brief Manages a shared Drogon PostgreSQL client.
class DbPool
{
  public:
    static void init(const std::string& connStr)
    {
        client_ =
            drogon::orm::DbClient::newPgClient(connStr, 4 /* connections */);
    }

    static drogon::orm::DbClientPtr& get() { return client_; }

  private:
    static inline drogon::orm::DbClientPtr client_;
};

} // namespace repo

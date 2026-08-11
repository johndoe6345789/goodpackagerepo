/**
 * @file DevTokenCtrl.h
 * @brief Dev token endpoint for local/offline tooling.
 *
 * Only active when JWT_SECRET is the default dev key.
 * Generates long-lived tokens with requested scopes.
 */

#pragma once

#include <drogon/HttpController.h>

namespace repo
{

class DevTokenCtrl
    : public drogon::HttpController<DevTokenCtrl>
{
  public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(DevTokenCtrl::create,
                  "/auth/dev-token", drogon::Post);
    ADD_METHOD_TO(DevTokenCtrl::verify,
                  "/auth/dev-token/verify", drogon::Post);
    METHOD_LIST_END

    /// @brief Mint a long-lived dev JWT.
    void create(
        const drogon::HttpRequestPtr& req,
        std::function<void(const drogon::HttpResponsePtr&)>&& cb);

    /// @brief Verify a dev token, return its claims.
    void verify(
        const drogon::HttpRequestPtr& req,
        std::function<void(const drogon::HttpResponsePtr&)>&& cb);
};

} // namespace repo

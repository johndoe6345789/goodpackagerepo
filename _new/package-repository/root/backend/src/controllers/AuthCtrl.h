/**
 * @file AuthCtrl.h
 * @brief Authentication endpoints: login, me, change-password.
 */

#pragma once

#include <drogon/HttpController.h>

namespace repo
{

class AuthCtrl : public drogon::HttpController<AuthCtrl>
{
  public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AuthCtrl::login, "/auth/login", drogon::Post);
    ADD_METHOD_TO(AuthCtrl::me, "/auth/me", drogon::Get, "repo::AuthFilter");
    ADD_METHOD_TO(AuthCtrl::changePassword, "/auth/change-password",
                  drogon::Post, "repo::AuthFilter");
    METHOD_LIST_END

    /// @brief Login with username/password, return JWT.
    void login(const drogon::HttpRequestPtr& req,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb);

    /// @brief Get current user info from token.
    void me(const drogon::HttpRequestPtr& req,
            std::function<void(const drogon::HttpResponsePtr&)>&& cb);

    /// @brief Change authenticated user's password.
    void
    changePassword(const drogon::HttpRequestPtr& req,
                   std::function<void(const drogon::HttpResponsePtr&)>&& cb);
};

} // namespace repo

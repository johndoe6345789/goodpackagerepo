/**
 * @file AuthFilter.h
 * @brief JWT authentication filter for Drogon.
 */

#pragma once

#include <drogon/HttpFilter.h>

namespace repo
{

/// @brief Extracts and verifies Bearer JWT, sets "principal"
///        attribute on the request. Rejects if invalid.
class AuthFilter : public drogon::HttpFilter<AuthFilter>
{
  public:
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& cb,
                  drogon::FilterChainCallback&& ccb) override;
};

/// @brief Like AuthFilter but allows anonymous read access.
class OptionalAuthFilter : public drogon::HttpFilter<OptionalAuthFilter>
{
  public:
    void doFilter(const drogon::HttpRequestPtr& req,
                  drogon::FilterCallback&& cb,
                  drogon::FilterChainCallback&& ccb) override;
};

} // namespace repo

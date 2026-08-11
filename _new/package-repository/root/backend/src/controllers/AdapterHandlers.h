/**
 * @file AdapterHandlers.h
 * @brief Handler functions for generic protocol adapters.
 *
 * Each handler uses DB-stored templates to produce
 * protocol-specific responses without per-protocol code.
 */

#pragma once

#include "../services/PgAdapterStore.h"

#include <drogon/HttpRequest.h>
#include <drogon/HttpResponse.h>

#include <functional>
#include <string>

namespace repo
{

/// @brief Serve index listing all packages in namespace.
void handleIndex(
    const AdapterInfo& a,
    const drogon::HttpRequestPtr& req,
    std::function<void(const drogon::HttpResponsePtr&)>&& cb);

/// @brief Serve package metadata (list versions).
void handlePackageMeta(
    const AdapterInfo& a,
    const drogon::HttpRequestPtr& req,
    const std::string& name,
    std::function<void(const drogon::HttpResponsePtr&)>&& cb);

/// @brief Serve version-specific metadata.
void handleVersionMeta(
    const AdapterInfo& a,
    const drogon::HttpRequestPtr& req,
    const std::string& name,
    const std::string& ver,
    std::function<void(const drogon::HttpResponsePtr&)>&& cb);

/// @brief Serve blob download for any protocol.
void handleDownload(
    const AdapterInfo& a,
    const drogon::HttpRequestPtr& req,
    const std::string& name,
    const std::string& ver,
    std::function<void(const drogon::HttpResponsePtr&)>&& cb);

} // namespace repo

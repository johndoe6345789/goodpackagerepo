/**
 * @file Globals.h
 * @brief Shared service instances and configuration.
 */

#pragma once

#include "DbPool.h"
#include "PgConfigStore.h"
#include "PgUserStore.h"
#include "S3BlobStore.h"

#include <filesystem>
#include <map>
#include <memory>
#include <string>

namespace repo
{

/// @brief Global service singletons, initialised in main.
struct Globals {
    static inline std::unique_ptr<S3BlobStore> blobs;
    static inline std::string jwtSecret;
    static inline std::string schemaJson;
    static inline int repoType = 0;

    // Upstream registries for pull-through proxying (empty = disabled).
    static inline std::string npmUpstream;   // e.g. https://registry.npmjs.org
    static inline std::string conanUpstream; // e.g. https://center.conan.io

    // Generic upstreams for the remaining ecosystems, keyed by adapter name
    // (pypi, cargo, maven, nuget, go, rubygems). Empty/absent = disabled.
    static inline std::map<std::string, std::string> upstreams;

    // Stored for deferred S3 init
    static inline std::string s3Ep_;
    static inline std::string s3Bkt_;
    static inline std::string s3Key_;

    /// @brief Init DB and config (safe before event loop).
    static void initConfig(
        const std::string& s3Ep, const std::string& s3Bkt,
        const std::string& s3Key, const std::string& secret,
        const std::string& dbConn)
    {
        s3Ep_ = s3Ep;
        s3Bkt_ = s3Bkt;
        s3Key_ = s3Key;
        jwtSecret = secret;
        DbPool::init(dbConn);
        PgUserStore::init();
        repoType = PgConfigStore::defaultRepoType();
    }

    /// @brief Init S3 (requires event loop running).
    static void initS3()
    {
        blobs = std::make_unique<S3BlobStore>(s3Ep_, s3Bkt_, s3Key_);
    }
};

} // namespace repo

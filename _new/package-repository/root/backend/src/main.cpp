/**
 * @file main.cpp
 * @brief Package repository server entry point.
 */

#include "controllers/GenericAdapterCtrl.h"
#include "services/AdapterGlobals.h"
#include "services/Globals.h"

#include <drogon/drogon.h>

#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <string>

static std::string env(const char* k, const char* def)
{
    auto v = std::getenv(k);
    return v ? v : def;
}

int main()
{
    namespace fs = std::filesystem;

    auto s3Ep = env("S3_ENDPOINT", "http://localhost:9000");
    auto s3Bk = env("S3_BUCKET", "packagerepo");
    auto s3Ak = env("S3_ACCESS_KEY", "minioadmin");
    auto jwt = env("JWT_SECRET", "dev-secret-key");
    auto db = env("DATABASE_URL",
        "host=localhost port=5432 dbname=packagerepo "
        "user=packagerepo password=packagerepo");

    repo::Globals::initConfig(s3Ep, s3Bk, s3Ak, jwt, db);
    // Upstream registries for pull-through proxying (empty disables it).
    repo::Globals::npmUpstream = env("NPM_UPSTREAM", "https://registry.npmjs.org");
    repo::Globals::conanUpstream = env("CONAN_UPSTREAM", "https://center2.conan.io");
    // Generic pull-through upstreams for the remaining ecosystems. Each fetches
    // from the public index, caches the bytes in S3 and serves from our URL.
    repo::Globals::upstreams["pypi"] = env("PYPI_UPSTREAM", "https://pypi.org");
    repo::Globals::upstreams["maven"] =
        env("MAVEN_UPSTREAM", "https://repo1.maven.org/maven2");
    repo::Globals::upstreams["go"] = env("GO_UPSTREAM", "https://proxy.golang.org");
    repo::Globals::upstreams["cargo"] =
        env("CARGO_UPSTREAM", "https://index.crates.io");
    repo::Globals::upstreams["nuget"] =
        env("NUGET_UPSTREAM", "https://api.nuget.org");
    repo::Globals::upstreams["rubygems"] =
        env("RUBYGEMS_UPSTREAM", "https://rubygems.org");
    repo::AdapterGlobals::init(repo::Globals::repoType);

    for (auto p : {fs::path("/app/schema.json"),
                   fs::path("schema.json")}) {
        if (fs::exists(p)) {
            std::ifstream f(p);
            repo::Globals::schemaJson = {
                std::istreambuf_iterator<char>(f),
                std::istreambuf_iterator<char>()};
            break;
        }
    }

    repo::registerAdapterRoutes();

    auto port = std::stoi(env("PORT", "5000"));
    // 120 s idle timeout so large S3 blob uploads (1-2 GB layers)
    // finish before the HTTP connection is closed by Drogon.
    drogon::app()
        .setLogLevel(trantor::Logger::kTrace)
        .setClientMaxBodySize(2ULL * 1024 * 1024 * 1024)
        .setIdleConnectionTimeout(120)
        .addListener("0.0.0.0", (uint16_t)port)
        .setThreadNum(8)
        .registerBeginningAdvice(
            [] { repo::Globals::initS3(); })
        .run();

    return 0;
}

/**
 * @file ArtifactTag.cpp
 * @brief Tag management endpoint for artifacts.
 */

#include "../services/DbPool.h"
#include "../services/Globals.h"
#include "../services/PgArtifactStore.h"
#include "../services/PgTagStore.h"
#include "ArtifactCtrl.h"

using namespace drogon;

namespace repo
{

static Json::Value errJson(const std::string& code, const std::string& msg)
{
    Json::Value e;
    e["error"]["code"] = code;
    e["error"]["message"] = msg;
    return e;
}

void ArtifactCtrl::setTag(const HttpRequestPtr& req,
                          std::function<void(const HttpResponsePtr&)>&& cb,
                          const std::string& ns, const std::string& name,
                          const std::string& tag)
{
    auto p = req->attributes()->get<Json::Value>("principal");
    auto json = req->getJsonObject();
    if (!json || !(*json)["target_version"].isString() ||
        !(*json)["target_variant"].isString()) {
        auto r = HttpResponse::newHttpJsonResponse(
            errJson("INVALID_REQUEST", "Missing fields"));
        r->setStatusCode(k400BadRequest);
        cb(r);
        return;
    }

    auto ver = (*json)["target_version"].asString();
    auto var = (*json)["target_variant"].asString();

    auto target = PgArtifactStore::get(Globals::repoType, ns, name, ver, var);
    if (target.isNull()) {
        auto r = HttpResponse::newHttpJsonResponse(
            errJson("TARGET_NOT_FOUND", "Target missing"));
        r->setStatusCode(k404NotFound);
        cb(r);
        return;
    }

    auto rows = DbPool::get()->execSqlSync(
        "SELECT id FROM artifacts WHERE repo_type=$1 "
        "AND namespace=$2 AND name=$3 "
        "AND version=$4 AND variant=$5",
        Globals::repoType, ns, name, ver, var);
    if (rows.empty()) {
        auto r = HttpResponse::newHttpJsonResponse(
            errJson("NOT_FOUND", "Artifact not found"));
        r->setStatusCode(k404NotFound);
        cb(r);
        return;
    }

    PgTagStore::set(Globals::repoType, ns, name, tag,
                    rows[0]["id"].as<int64_t>(), p["sub"].asString());

    Json::Value out;
    out["ok"] = true;
    cb(HttpResponse::newHttpJsonResponse(out));
}

} // namespace repo

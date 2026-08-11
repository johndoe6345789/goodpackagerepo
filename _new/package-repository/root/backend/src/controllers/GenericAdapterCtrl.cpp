/**
 * @file GenericAdapterCtrl.cpp
 * @brief Dynamic route registration for all protocol adapters.
 *
 * Reads adapter configs from AdapterGlobals (loaded from DB)
 * and registers Drogon handlers for meta + download routes.
 * Drogon supports max 2 path params ({1}, {2}).
 */

#include "GenericAdapterCtrl.h"
#include "AdapterHandlers.h"
#include "AdapterProxy.h"
#include "../services/AdapterGlobals.h"
#include "../services/AdapterTemplate.h"
#include "../services/Globals.h"

#include <drogon/drogon.h>

#include <string>

using namespace drogon;
using Cb = std::function<void(const HttpResponsePtr&)>;

namespace repo
{

void registerAdapterRoutes()
{
    auto& vec = AdapterGlobals::adapters;

    for (size_t i = 0; i < vec.size(); ++i) {
        auto* pa = &vec[i];

        // Conan v2: serve as a transparent upstream proxy (no hosted routes)
        // when an upstream is configured. A single catch-all under the prefix
        // covers revisions/files/packages — the declarative routes can't.
        if (pa->name == "conan" && !Globals::conanUpstream.empty()) {
            auto pfx = pa->prefix;
            app().registerHandlerViaRegex(pfx + "(?:/.*)?",
                [pfx](const HttpRequestPtr& r, Cb&& cb) {
                    std::string p = r->path();
                    auto q = r->getQuery();
                    if (!q.empty()) p += "?" + q;
                    auto resp = proxyConan(pfx, p);
                    cb(resp ? resp : HttpResponse::newNotFoundResponse());
                }, {Get});
            continue;
        }

        // npm: transparent pull-through proxy. The hosted single-segment route
        // can't match scoped @scope/name or tarball (/-/) paths, so proxy all.
        if (pa->name == "npm" && !Globals::npmUpstream.empty()) {
            auto pfx = pa->prefix;
            app().registerHandlerViaRegex(pfx + "(?:/.*)?",
                [pfx](const HttpRequestPtr& r, Cb&& cb) {
                    std::string p = r->path();
                    auto q = r->getQuery();
                    if (!q.empty()) p += "?" + q;
                    auto resp = proxyNpm(pfx, p, r);
                    cb(resp ? resp : HttpResponse::newNotFoundResponse());
                }, {Get});
            continue;
        }

        // Any other ecosystem with a configured upstream: transparent
        // pull-through (pypi rewrites its file-host URLs; the rest are
        // path-based and need none). Caches every fetch to S3.
        {
            auto upIt = Globals::upstreams.find(pa->name);
            if (upIt != Globals::upstreams.end() && !upIt->second.empty()) {
                auto pfx = pa->prefix;
                auto nm = pa->name;
                app().registerHandlerViaRegex(pfx + "(?:/.*)?",
                    [pfx, nm](const HttpRequestPtr& r, Cb&& cb) {
                        std::string p = r->path();
                        auto q = r->getQuery();
                        if (!q.empty()) p += "?" + q;
                        HttpResponsePtr resp = (nm == "pypi")
                            ? proxyPypi(pfx, p, r)
                            : proxyGeneric(pfx, p, Globals::upstreams[nm]);
                        cb(resp ? resp
                                : HttpResponse::newNotFoundResponse());
                    }, {Get});
                continue;
            }
        }

        if (pa->metaRegex.empty()) continue;

        int params = countPathParams(pa->metaRegex);

        if (params > 2) continue;

        // Register meta or index handler
        if (pa->isIndex && params == 0) {
            app().registerHandler(pa->metaRegex,
                [pa](const HttpRequestPtr& r, Cb&& cb) {
                    handleIndex(*pa, r, std::move(cb));
                }, {Get});
        } else if (pa->isIndex && params == 1) {
            app().registerHandler(pa->metaRegex,
                [pa](const HttpRequestPtr& r, Cb&& cb,
                     const std::string&) {
                    handleIndex(*pa, r, std::move(cb));
                }, {Get});
        } else if (pa->isIndex && params == 2) {
            app().registerHandler(pa->metaRegex,
                [pa](const HttpRequestPtr& r, Cb&& cb,
                     const std::string&,
                     const std::string&) {
                    handleIndex(*pa, r, std::move(cb));
                }, {Get});
        } else if (params == 1) {
            auto route = pa->metaRegex;
            app().registerHandler(route,
                [pa](const HttpRequestPtr& r, Cb&& cb,
                     const std::string& p1) {

                    handlePackageMeta(
                        *pa, r, p1, std::move(cb));
                }, {Get});
        } else if (params == 2) {
            app().registerHandler(pa->metaRegex,
                [pa](const HttpRequestPtr& r, Cb&& cb,
                     const std::string& p1,
                     const std::string& p2) {
                    handleVersionMeta(
                        *pa, r, p1, p2, std::move(cb));
                }, {Get});
        }

        // Standard download: {prefix}/dl/{name}/{ver}
        auto dlPath = pa->prefix + "/dl/{1}/{2}";
        app().registerHandler(dlPath,
            [pa](const HttpRequestPtr& r, Cb&& cb,
                 const std::string& n,
                 const std::string& v) {
                handleDownload(
                    *pa, r, n, v, std::move(cb));
            }, {Get});
    }
}

} // namespace repo

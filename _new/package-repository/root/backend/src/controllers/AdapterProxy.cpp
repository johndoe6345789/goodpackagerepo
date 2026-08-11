/**
 * @file AdapterProxy.cpp
 * @brief npm pull-through proxy helpers.
 */

#include "AdapterProxy.h"
#include "../services/Globals.h"
#include "../services/ProxyCache.h"

#include <json/json.h>

using namespace drogon;

namespace repo
{

static std::string baseUrl(const HttpRequestPtr& req)
{
    auto scheme = req->getHeader("X-Forwarded-Proto");
    if (scheme.empty()) scheme = "http";
    return scheme + "://" + req->getHeader("Host");
}

// npm tarball file name drops any @scope/ prefix: @s/p -> p-<ver>.tgz
static std::string tarballPath(const std::string& name, const std::string& ver)
{
    auto slash = name.rfind('/');
    auto file = slash == std::string::npos ? name : name.substr(slash + 1);
    return "/" + name + "/-/" + file + "-" + ver + ".tgz";
}

drogon::HttpResponsePtr proxyNpmMeta(const AdapterInfo& a,
                                     const HttpRequestPtr& req,
                                     const std::string& name)
{
    if (a.name != "npm" || Globals::npmUpstream.empty())
        return nullptr;

    auto res = ProxyCache::fetch(Globals::npmUpstream, "/" + name);
    if (!res.ok)
        return nullptr;

    Json::CharReaderBuilder rb;
    Json::Value doc;
    std::string errs;
    std::unique_ptr<Json::CharReader> rd(rb.newCharReader());
    if (!rd->parse(res.body.data(), res.body.data() + res.body.size(), &doc,
                   &errs))
        return nullptr;

    // Rewrite every version's tarball URL to this server's download route so
    // the tarball fetch also pulls through here.
    const auto dl = baseUrl(req) + a.prefix + "/dl/" + name + "/";
    for (const auto& ver : doc["versions"].getMemberNames())
        doc["versions"][ver]["dist"]["tarball"] = dl + ver;

    Json::StreamWriterBuilder wb;
    wb["indentation"] = "";
    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString("application/json");
    r->setBody(Json::writeString(wb, doc));
    return r;
}

drogon::HttpResponsePtr proxyNpmDownload(const AdapterInfo& a,
                                         const std::string& name,
                                         const std::string& ver)
{
    if (a.name != "npm" || Globals::npmUpstream.empty())
        return nullptr;

    auto res = ProxyCache::fetch(Globals::npmUpstream, tarballPath(name, ver));
    if (!res.ok)
        return nullptr;

    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString(a.contentType);
    r->setBody(std::move(res.body));
    return r;
}

static void replaceAll(std::string& s, const std::string& from,
                       const std::string& to)
{
    if (from.empty())
        return;
    size_t pos = 0;
    while ((pos = s.find(from, pos)) != std::string::npos) {
        s.replace(pos, from.size(), to);
        pos += to.size();
    }
}

drogon::HttpResponsePtr proxyNpm(const std::string& prefix,
                                 const std::string& fullPath,
                                 const HttpRequestPtr& req)
{
    if (Globals::npmUpstream.empty())
        return nullptr;

    std::string up = fullPath.substr(prefix.size());
    if (up.empty())
        up = "/";
    else if (up.front() != '/')
        up = "/" + up;

    auto res = ProxyCache::fetch(Globals::npmUpstream, up);
    if (!res.ok)
        return nullptr;

    auto r = HttpResponse::newHttpResponse();
    if (up.find("/-/") != std::string::npos) {
        // tarball / binary asset — serve bytes verbatim (shasum still matches)
        r->setContentTypeString("application/octet-stream");
        r->setBody(std::move(res.body));
    } else {
        // package metadata — repoint upstream tarball URLs at this server so
        // the tarball fetch also pulls through here.
        std::string body = std::move(res.body);
        replaceAll(body, Globals::npmUpstream, baseUrl(req) + prefix);
        r->setContentTypeString("application/json");
        r->setBody(std::move(body));
    }
    return r;
}

drogon::HttpResponsePtr proxyConan(const std::string& prefix,
                                   const std::string& fullPath)
{
    if (Globals::conanUpstream.empty())
        return nullptr;

    // /conan/v2/... -> upstream /v2/...
    std::string up = fullPath.substr(prefix.size());
    if (up.empty() || up.front() != '/')
        up = "/" + up;

    // conan validates a remote via /v1/ping (then /v2 for revisions),
    // expecting the capabilities header (the upstream CDN 404s it). Answer it
    // ourselves so the remote is "valid".
    const bool isPing = up.size() >= 5 && up.compare(up.size() - 5, 5, "/ping") == 0;
    if (isPing) {
        auto r = HttpResponse::newHttpResponse();
        r->setStatusCode(k200OK);
        r->addHeader("X-Conan-Server-Capabilities", "revisions,complex_search");
        return r;
    }

    auto res = ProxyCache::fetch(Globals::conanUpstream, up);
    if (!res.ok)
        return nullptr;

    // ".../files/<name>" is a binary artifact; everything else is JSON.
    const bool isFile = up.find("/files/") != std::string::npos;
    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString(isFile ? "application/octet-stream"
                                   : "application/json");
    r->setBody(std::move(res.body));
    return r;
}

static bool endsWith(const std::string& s, const std::string& suf)
{
    return s.size() >= suf.size()
           && s.compare(s.size() - suf.size(), suf.size(), suf) == 0;
}

static std::string guessType(const std::string& path)
{
    if (endsWith(path, ".json")) return "application/json";
    if (endsWith(path, ".xml") || endsWith(path, ".pom"))
        return "application/xml";
    if (endsWith(path, "/") || endsWith(path, ".html")) return "text/html";
    return "application/octet-stream";
}

drogon::HttpResponsePtr proxyGeneric(const std::string& prefix,
                                     const std::string& fullPath,
                                     const std::string& upstream)
{
    if (upstream.empty())
        return nullptr;

    std::string up = fullPath.substr(prefix.size());
    if (up.empty() || up.front() != '/')
        up = "/" + up;

    auto res = ProxyCache::fetch(upstream, up);
    if (!res.ok)
        return nullptr;

    auto r = HttpResponse::newHttpResponse();
    r->setContentTypeString(guessType(up));
    r->setBody(std::move(res.body));
    return r;
}

drogon::HttpResponsePtr proxyPypi(const std::string& prefix,
                                  const std::string& fullPath,
                                  const HttpRequestPtr& req)
{
    auto it = Globals::upstreams.find("pypi");
    if (it == Globals::upstreams.end() || it->second.empty())
        return nullptr;

    std::string up = fullPath.substr(prefix.size());
    if (up.empty() || up.front() != '/')
        up = "/" + up;

    // The Simple index links to a separate file host; proxy those too so the
    // whole download path stays on this server (and caches to S3).
    static const std::string FILES = "https://files.pythonhosted.org";

    // {prefix}/files/<path> -> files.pythonhosted.org/<path> (wheel / sdist)
    if (up.rfind("/files/", 0) == 0) {
        auto res = ProxyCache::fetch(FILES, up.substr(6)); // drop "/files"
        if (!res.ok)
            return nullptr;
        auto r = HttpResponse::newHttpResponse();
        r->setContentTypeString("application/octet-stream");
        r->setBody(std::move(res.body));
        return r;
    }

    // Simple index (HTML or JSON): rewrite the file host back to us.
    auto res = ProxyCache::fetch(it->second, up);
    if (!res.ok)
        return nullptr;

    std::string body = std::move(res.body);
    replaceAll(body, FILES, baseUrl(req) + prefix + "/files");

    auto r = HttpResponse::newHttpResponse();
    const bool isJson = !body.empty() && (body.front() == '{'
                                          || body.front() == '[');
    r->setContentTypeString(isJson ? "application/vnd.pypi.simple.v1+json"
                                   : "text/html");
    r->setBody(std::move(body));
    return r;
}

} // namespace repo

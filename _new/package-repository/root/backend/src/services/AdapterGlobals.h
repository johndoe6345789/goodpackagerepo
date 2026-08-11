/**
 * @file AdapterGlobals.h
 * @brief Cached protocol adapter configs, loaded at startup.
 */

#pragma once

#include "PgAdapterStore.h"

#include <vector>

namespace repo
{

/// @brief Cached adapters, loaded once on server start.
struct AdapterGlobals {
    static inline std::vector<AdapterInfo> adapters;

    /// @brief Load adapters from DB for a repo type.
    static void init(int repoType)
    {
        adapters = PgAdapterStore::loadAll(repoType);
    }

    /// @brief Find adapter by name.
    static const AdapterInfo* byName(const std::string& n)
    {
        return PgAdapterStore::findByName(adapters, n);
    }
};

} // namespace repo

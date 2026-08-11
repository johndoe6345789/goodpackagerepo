/**
 * @file GenericAdapterCtrl.h
 * @brief Single generic controller for all protocol adapters.
 *
 * Routes are registered dynamically from DB-stored patterns.
 * Response formats come from DB-stored templates.
 * No per-protocol C++ code needed.
 */

#pragma once

namespace repo
{

/// @brief Register all adapter routes from DB config.
/// Call after AdapterGlobals::init() and before app().run().
void registerAdapterRoutes();

} // namespace repo

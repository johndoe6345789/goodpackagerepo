cmake_minimum_required(VERSION 3.20)
project(packagerepo-backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(Drogon REQUIRED)
find_package(OpenSSL REQUIRED)

add_executable(packagerepo-server
    src/main.cpp
    src/controllers/AuthCtrl.cpp
    src/controllers/ArtifactCtrl.cpp
    src/controllers/ArtifactQuery.cpp
    src/controllers/ArtifactTag.cpp
    src/controllers/HealthCtrl.cpp
    src/controllers/AdminCtrl.cpp
    src/controllers/DevTokenCtrl.cpp
    src/controllers/DevTokenVerify.cpp
    src/controllers/GenericAdapterCtrl.cpp
    src/controllers/RegistryV2Blob.cpp
    src/controllers/RegistryV2Catalog.cpp
    src/controllers/RegistryV2Manifest.cpp
    src/controllers/RegistryV2Upload.cpp
    src/controllers/AdapterHandlers.cpp
    src/controllers/AdapterHandlersDownload.cpp
    src/controllers/AdapterProxy.cpp
    src/filters/AuthFilter.cpp
    src/services/S3BlobStore.cpp
    src/services/ProxyCache.cpp
    src/services/PgAdapterStore.cpp
)

target_include_directories(packagerepo-server
    PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(packagerepo-server
    PRIVATE
        Drogon::Drogon
        OpenSSL::SSL
        OpenSSL::Crypto
)

install(TARGETS packagerepo-server
    RUNTIME DESTINATION bin
)

# syntax=docker/dockerfile:1.7
ARG DEPS_IMAGE=debian:sid
ARG RUNTIME_IMAGE=debian:sid-slim

FROM ${DEPS_IMAGE} AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates cmake gcc-13 g++-13 git make \
    pkg-config libssl-dev libpq-dev \
    python3 python3-pip && \
    update-alternatives --install \
        /usr/bin/gcc gcc /usr/bin/gcc-13 100 && \
    update-alternatives --install \
        /usr/bin/g++ g++ /usr/bin/g++-13 100 && \
    update-alternatives --install \
        /usr/bin/cc cc /usr/bin/gcc-13 100 && \
    pip3 install --break-system-packages \
    "conan>=2.0,<3.0" && \
    conan profile detect --force && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY backend/conanfile.txt .

ENV CONAN_SKIP_TEST=1
RUN conan install . --build=missing \
    -s build_type=Release \
    -s compiler.cppstd=20 \
    -of /build/conan

COPY backend/CMakeLists.txt .
COPY backend/src/ src/
RUN cmake -B out \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_TOOLCHAIN_FILE=/build/conan/conan_toolchain.cmake \
    && cmake --build out -j$(nproc)

FROM ${RUNTIME_IMAGE}
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates libpq5 libssl3 \
    postgresql-client && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/out/packagerepo-server /usr/bin/
COPY schema.json /app/schema.json
COPY backend/migrations/ /app/migrations/
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /data/blobs
ENV DATA_DIR=/data

EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]

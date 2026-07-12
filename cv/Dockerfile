FROM ghcr.io/xu-cheng/texlive-debian@sha256:3bdf292b53c04ffa3ca694a5114397859bcd39b6b417c212414e1505e7fe8ec5

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
        fonts-noto-cjk \
        poppler-utils \
        qpdf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Optimized Jekyll build container with pre-installed dependencies
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install all required system packages in a single layer
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    imagemagick \
    ruby \
    ruby-dev \
    python3 \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install bundler
RUN gem install bundler

# Pre-install Python packages for SEO script
RUN python3 -m pip install --no-cache-dir \
    colorama \
    requests \
    beautifulsoup4 \
    tabulate

# Set working directory
WORKDIR /workspace

# Default command
CMD ["/bin/bash"]

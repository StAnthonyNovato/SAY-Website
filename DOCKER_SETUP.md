# Custom Docker Container for Jekyll Builds

This repository uses a custom Docker container to speed up GitHub Actions builds by pre-installing all system dependencies.

## What's Included

The custom container (`ghcr.io/[your-repo]-builder:latest`) includes:

- Ubuntu 22.04 base image
- ImageMagick (for image processing)
- Ruby and Bundler
- Python 3 with pre-installed packages:
  - colorama
  - requests
  - beautifulsoup4
  - tabulate
- Build essentials and other utilities

## Build Process

1. **Docker Image Building**: The `.github/workflows/docker-build.yml` workflow automatically builds and publishes the Docker image when:
   - The `Dockerfile` is modified
   - The workflow file itself is changed
   - Manually triggered

2. **Jekyll Build**: The main Jekyll workflow (`.github/workflows/jekyll.yml`) uses this custom container, which eliminates the need to:
   - Run `apt-get update && apt-get install imagemagick`
   - Install Python packages with `pip install`
   - This saves 1-2 minutes per build

3. **Fallback Mechanism**: If the custom container fails for any reason, a fallback job runs using the traditional approach with individual package installations.

## Performance Benefits

- **Faster builds**: Pre-installed dependencies reduce build time by 1-2 minutes
- **Reliability**: Container images are cached and versioned
- **Consistency**: Same environment across all builds
- **Reduced network usage**: No repeated package downloads

## Container Registry

The container is published to GitHub Container Registry (GHCR) and is automatically accessible to GitHub Actions in the same repository.

## Updating Dependencies

To add new system packages or Python dependencies:

1. Modify the `Dockerfile`
2. Commit and push the changes
3. The docker-build workflow will automatically create a new image
4. Subsequent Jekyll builds will use the updated container

## Manual Container Build

To build the container locally for testing:

```bash
docker build -t jekyll-builder .
docker run -it --rm -v $(pwd):/workspace jekyll-builder
```

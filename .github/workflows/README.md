# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated CI/CD of the Drupal 11 project.

## Stage Branch Deployment

The `stage-deploy.yml` workflow runs automatically when code is pushed to the `stage` branch.

### Workflow Features

- **Multi-stage Docker build** following DEVELOPER_NOTES.md guidelines
- **Composer dependency caching** using `actions/cache@v4` and `ramsey/composer-install@v3`
- **Node.js dependency caching** using `actions/setup-node@v4`
- **Docker layer caching** using GitHub Actions cache
- **Security scanning** with Trivy vulnerability scanner
- **Azure Container Registry** push with multiple tags

### Required Secrets

Configure these secrets in your GitHub repository settings:

- `ACR_USERNAME`: Azure Container Registry username
- `ACR_PASSWORD`: Azure Container Registry password

### Environment Variables

Update these variables in the workflow file:

- `REGISTRY`: Your Azure Container Registry URL (e.g., `myregistry.azurecr.io`)
- `IMAGE_NAME`: Your container image name (e.g., `drupal-app`)

### Tags Generated

The workflow generates the following Docker image tags:

- `stage`: Always applied for stage branch builds
- `latest`: Applied when building the default branch
- `stage-<commit-sha>`: Unique tag with branch and commit SHA

### Security Features

- **Vulnerability scanning** with Trivy
- **SARIF upload** to GitHub Security tab
- **Secure file permissions** in Docker image (640/750 as per DEVELOPER_NOTES.md)
- **Non-root user** execution in container
- **Multi-stage build** to minimize attack surface

### Dependencies Aligned with DEVELOPER_NOTES.md

- Uses recommended PHP 8.3 and Drupal 11.1.5 base image
- Implements secure file ownership (deploy:www-data)
- Follows multi-stage build pattern for optimal caching
- Uses latest GitHub Actions versions (cache@v4, build-push-action@v6)
- Includes Composer security audit step

### Local Testing

To test the Docker build locally:

```bash
# Build the image
docker build -f docker/Dockerfile -t drupal-app:local .

# Run the container
docker run -p 9000:9000 drupal-app:local
```

### Troubleshooting

1. **ACR Authentication Errors**: Verify ACR_USERNAME and ACR_PASSWORD secrets
2. **Build Cache Issues**: Clear GitHub Actions cache if builds become inconsistent
3. **Composer Errors**: Ensure composer.lock is committed and up to date
4. **Node.js Build Errors**: Verify package.json and package-lock.json are present

For more details, see the project's DEVELOPER_NOTES.md file.
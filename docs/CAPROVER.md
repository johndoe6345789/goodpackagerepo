# CapRover Deployment Guide

This guide walks you through deploying goodpackagerepo on [CapRover](https://caprover.com/), a free and open-source PaaS (Platform as a Service).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Overview](#overview)
- [Deployment Steps](#deployment-steps)
  - [1. Backend Deployment](#1-backend-deployment)
  - [2. Frontend Deployment](#2-frontend-deployment)
- [Configuration](#configuration)
- [SSL/HTTPS Setup](#ssl-https-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Updating Your Deployment](#updating-your-deployment)

## Prerequisites

Before you begin, ensure you have:

1. **A CapRover instance** running and accessible
   - Follow the [CapRover installation guide](https://caprover.com/docs/get-started.html) if you haven't set one up
   - You can use a DigitalOcean droplet, AWS EC2, or any VPS
   
2. **CapRover CLI** installed on your local machine:
   ```bash
   npm install -g caprover
   ```

3. **Your CapRover instance configured**:
   ```bash
   caprover serversetup
   ```

4. **A GitHub repository** with the goodpackagerepo code (or clone the original)

5. **Basic knowledge** of:
   - Command line operations
   - Environment variables
   - DNS configuration (for custom domains)

## Overview

goodpackagerepo consists of two main components:

- **Backend**: Flask-based Python API (Port 5000)
- **Frontend**: Next.js React application (Port 3000)

You'll deploy these as two separate CapRover apps that communicate with each other.

## Deployment Steps

### 1. Backend Deployment

#### Create the Backend App

1. Log in to your CapRover dashboard (e.g., `https://captain.your-domain.com`)

2. Go to **Apps** and click **"Create New App"**

3. Enter the app name: `goodrepo-backend` (or your preferred name)
   - Check **"Has Persistent Data"** to preserve your package data
   - Click **"Create New App"**

#### Configure Backend Environment Variables

1. Click on your newly created `goodrepo-backend` app

2. Go to the **"App Configs"** tab

3. Scroll down to **"Environmental Variables"** and add:

   ```
   JWT_SECRET=your-very-secure-random-secret-key-change-this
   DATA_DIR=/data
   FLASK_ENV=production
   ```

   **Important**: Generate a strong random string for `JWT_SECRET`. You can use:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

4. Click **"Add Persistent Directory"**:
   - Path in App: `/data`
   - Label: `backend-data`
   - Click **"Save & Update"**

#### Deploy Backend from GitHub

1. Still in the `goodrepo-backend` app, go to **"Deployment"** tab

2. Select **"Method 3: Deploy from Github/Bitbucket/Gitlab"**

3. Configure the deployment:
   - **Repository**: `https://github.com/johndoe6345789/goodpackagerepo`
   - **Branch**: `main` (or your preferred branch)
   - **Username**: Your GitHub username
   - **Password/Token**: Your GitHub personal access token
     - Create one at https://github.com/settings/tokens
     - Only needs `repo` scope for public repos

4. **Captain Definition File Path**: `./backend/captain-definition`

5. Click **"Save & Update"**

6. The deployment will start automatically. Monitor the logs in the **"App Logs"** section

#### Verify Backend Deployment

Once deployment completes:

1. Go to **"HTTP Settings"** tab
2. Enable **"Websocket Support"** (recommended)
3. Note your backend URL (e.g., `https://goodrepo-backend.your-domain.com`)

Test the backend:
```bash
curl https://goodrepo-backend.your-domain.com/auth/login
```

You should see a response about missing credentials (this is expected).

### 2. Frontend Deployment

#### Create the Frontend App

1. Go to **Apps** and click **"Create New App"**

2. Enter the app name: `goodrepo-frontend` (or your preferred name)
   - No persistent data needed for frontend
   - Click **"Create New App"**

#### Configure Frontend Environment Variables

1. Click on your `goodrepo-frontend` app

2. Go to **"App Configs"** tab

3. Add the following environment variables:

   **Option 1: Separate Backend Domain (Traditional)**
   ```
   NEXT_PUBLIC_API_URL=https://goodrepo-backend.your-domain.com
   NODE_ENV=production
   PORT=3000
   ```
   **Important**: Replace `goodrepo-backend.your-domain.com` with your actual backend URL from step 1.

   **Option 2: Single Domain with Next.js Proxy (New)**
   ```
   NEXT_PUBLIC_API_URL=
   BACKEND_URL=http://goodrepo-backend:5000
   NODE_ENV=production
   PORT=3000
   ```
   This option allows the frontend to proxy `/auth/*`, `/v1/*`, `/admin/*`, `/health`, and `/schema` requests to the backend internally.
   With this setup, users access everything through the frontend domain (e.g., `https://repo.wardcrew.com/auth/login`).
   **Important**: Replace `goodrepo-backend` with your actual backend app name in CapRover.

4. Click **"Save & Update"**

#### Deploy Frontend from GitHub

1. Go to the **"Deployment"** tab

2. Select **"Method 3: Deploy from Github/Bitbucket/Gitlab"**

3. Configure the deployment:
   - **Repository**: `https://github.com/johndoe6345789/goodpackagerepo`
   - **Branch**: `main`
   - **Username**: Your GitHub username
   - **Password/Token**: Your GitHub personal access token

4. **Captain Definition File Path**: `./frontend/captain-definition`

5. Click **"Save & Update"**

6. Monitor the build in the logs (this may take 5-10 minutes for the first build)

#### Verify Frontend Deployment

1. Once deployed, go to **"HTTP Settings"** tab
2. Note your frontend URL (e.g., `https://goodrepo-frontend.your-domain.com`)
3. Visit the URL in your browser

You should see the goodpackagerepo interface!

## Configuration

### Default Credentials

On first deployment, the system uses default credentials:
- **Username**: `admin`
- **Password**: `admin`

**⚠️ IMPORTANT**: Change these immediately after first login!

1. Log in with default credentials
2. Go to user settings or use the API:
   ```bash
   curl -X POST https://goodrepo-backend.your-domain.com/auth/change-password \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"old_password": "admin", "new_password": "your-new-secure-password"}'
   ```

### Custom Domain (Optional)

To use a custom domain:

1. In CapRover, go to your app's **"HTTP Settings"**
2. Click **"Connect New Domain"**
3. Enter your domain (e.g., `packages.yourdomain.com`)
4. Add the DNS record as shown (usually a CNAME or A record)
5. Wait for DNS propagation (can take up to 48 hours, usually much faster)
6. Update the frontend's `NEXT_PUBLIC_API_URL` if you added a custom domain to backend

## SSL/HTTPS Setup

CapRover automatically provides SSL certificates via Let's Encrypt:

1. Ensure your domain is pointing to your CapRover instance
2. In the app's **"HTTP Settings"** tab
3. Click **"Enable HTTPS"** 
4. Click **"Force HTTPS"** to redirect all HTTP traffic to HTTPS
5. CapRover will automatically obtain and renew SSL certificates

**Note**: SSL setup only works after DNS has propagated and your domain is accessible.

## Verification

After deployment, verify everything is working:

### 1. Test Backend API

**If using Option 1 (Separate Backend Domain):**
```bash
# Health check (if implemented)
curl https://goodrepo-backend.your-domain.com/

# Login endpoint
curl -X POST https://goodrepo-backend.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

**If using Option 2 (Single Domain with Next.js Proxy):**
```bash
# Login endpoint through frontend proxy
curl -X POST https://goodrepo-frontend.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

### 2. Test Frontend

1. Open `https://goodrepo-frontend.your-domain.com` in your browser
2. Try logging in with default credentials
3. Upload a test package or browse the interface

### 3. Test Package Upload

**If using Option 1 (Separate Backend Domain):**
```bash
# Login to get token
TOKEN=$(curl -X POST https://goodrepo-backend.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}' | jq -r '.token')

# Upload a test package
echo "test content" > test.txt
curl -X PUT "https://goodrepo-backend.your-domain.com/v1/test/package/1.0.0/default/blob" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @test.txt
```

**If using Option 2 (Single Domain with Next.js Proxy):**
```bash
# Login to get token through frontend proxy
TOKEN=$(curl -X POST https://goodrepo-frontend.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}' | jq -r '.token')

# Upload a test package through frontend proxy
echo "test content" > test.txt
curl -X PUT "https://goodrepo-frontend.your-domain.com/v1/test/package/1.0.0/default/blob" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @test.txt
```

## Troubleshooting

### Backend Won't Start

**Issue**: Backend deployment fails or app won't start

**Solutions**:
1. Check the app logs in CapRover dashboard
2. Verify all environment variables are set correctly
3. Ensure `DATA_DIR` is set to `/data`
4. Verify persistent directory is mounted at `/data`
5. Check that `JWT_SECRET` is set (no default value)

### Frontend Can't Connect to Backend

**Issue**: Frontend loads but API calls fail

**Solutions**:
1. Verify `NEXT_PUBLIC_API_URL` points to the correct backend URL
2. Ensure backend URL includes `https://` prefix
3. Check that backend is accessible from the internet
4. Verify CORS is properly configured (should work by default)
5. Check browser console for specific error messages

### Build Failures

**Issue**: Frontend build fails during deployment

**Solutions**:
1. Check the deployment logs for specific errors
2. Verify the `captain-definition` file path is correct: `./frontend/captain-definition`
3. Ensure repository access token has correct permissions
4. Try redeploying from the CapRover dashboard

### Persistent Data Not Saving

**Issue**: Data disappears after redeployment

**Solutions**:
1. Verify "Has Persistent Data" was checked when creating the app
2. Check that persistent directory is added: `/data`
3. Ensure `DATA_DIR=/data` environment variable is set
4. In App Configs, verify the persistent directory mapping exists

### SSL Certificate Errors

**Issue**: SSL certificate not working or showing warnings

**Solutions**:
1. Verify DNS is properly configured and propagated
2. Wait a few minutes for Let's Encrypt to issue certificate
3. Check CapRover dashboard for SSL status
4. Try disabling and re-enabling HTTPS
5. Ensure domain is accessible from internet (not behind firewall)

### Performance Issues

**Issue**: App is slow or unresponsive

**Solutions**:
1. Check server resources (CPU, RAM, Disk)
2. Consider upgrading your VPS plan
3. Monitor app logs for errors
4. Check database/blob storage performance
5. Consider adding caching layer if handling high traffic

### Can't Login / Authentication Issues

**Issue**: Unable to login with credentials

**Solutions**:
1. Verify backend is running and accessible
2. Check that `JWT_SECRET` environment variable is set
3. Try using default credentials: `admin` / `admin`
4. Check backend logs for authentication errors
5. Verify the backend data directory has proper permissions

## Updating Your Deployment

### Manual Update

To update your deployment with new code:

1. Push your changes to your Git repository
2. In CapRover dashboard, go to your app's **"Deployment"** tab
3. Click **"Force Build"** or push a new commit
4. Monitor the deployment logs

### Automatic Updates

You can set up webhooks for automatic deployment:

1. In the **"Deployment"** tab, find the webhook URL
2. Add this as a webhook in your GitHub repository settings
3. Set it to trigger on `push` events to your main branch
4. Now every push will automatically deploy to CapRover

### Rollback

If something goes wrong:

1. Go to **"Deployment"** tab in CapRover
2. Find the previous successful version
3. Click **"Deploy"** on that version to rollback

## Best Practices

1. **Security**:
   - Change default passwords immediately
   - Use strong JWT secrets (32+ characters)
   - Enable HTTPS and force HTTPS redirects
   - Regularly update dependencies

2. **Backups**:
   - Regularly backup your `/data` directory
   - Export critical package metadata
   - Keep configuration documented

3. **Monitoring**:
   - Set up monitoring for your apps
   - Check logs regularly
   - Monitor disk space usage in persistent directories

4. **Performance**:
   - Use appropriate VPS sizing for your load
   - Consider CDN for frequently accessed packages
   - Monitor resource usage in CapRover dashboard

5. **Updates**:
   - Test updates in a staging environment first
   - Keep CapRover itself updated
   - Review changelogs before updating

## Additional Resources

- [CapRover Documentation](https://caprover.com/docs/)
- [goodpackagerepo GitHub](https://github.com/johndoe6345789/goodpackagerepo)
- [Main README](../README.md)
- [Docker Compose Setup](../README.md#using-docker-compose)

## Support

If you encounter issues not covered in this guide:

1. Check the [main README](../README.md) for general information
2. Review CapRover logs in the dashboard
3. Search existing GitHub issues
4. Create a new issue with:
   - Detailed description of the problem
   - Relevant log excerpts
   - Steps to reproduce
   - Your environment details (CapRover version, OS, etc.)

---

**Happy deploying! 🚀**

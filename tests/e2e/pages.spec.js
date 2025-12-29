import { test, expect } from '@playwright/test';

test.describe('Browse Page', () => {
  test('should display browse page', async ({ page }) => {
    await page.goto('/browse');
    
    // Check for page elements
    await expect(page.locator('h1')).toContainText('Browse Packages');
    await expect(page.locator('text=Explore available packages')).toBeVisible();
    
    // Check for search input
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should filter packages by search term', async ({ page }) => {
    await page.goto('/browse');
    
    // Get initial package count
    const initialPackages = await page.locator('[class*="package"]').count();
    expect(initialPackages).toBeGreaterThan(0);
    
    // Search for specific package
    await page.fill('input[placeholder*="Search"]', 'example');
    
    // Should show filtered results
    await expect(page.locator('text=example-package')).toBeVisible();
  });

  test('should show empty state when no packages match', async ({ page }) => {
    await page.goto('/browse');
    
    // Search for non-existent package
    await page.fill('input[placeholder*="Search"]', 'nonexistentpackage12345');
    
    // Should show empty state
    await expect(page.locator('text=No packages found')).toBeVisible();
  });
});

test.describe('Publish Page', () => {
  test('should display publish form', async ({ page }) => {
    await page.goto('/publish');
    
    // Check for page elements
    await expect(page.locator('h1')).toContainText('Publish Package');
    
    // Check for form fields
    await expect(page.locator('input[name="namespace"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="version"]')).toBeVisible();
    await expect(page.locator('input[name="variant"]')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    await page.goto('/publish');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Form should require fields (browser validation)
    const namespaceInput = page.locator('input[name="namespace"]');
    await expect(namespaceInput).toHaveAttribute('required', '');
  });

  test('should reset form', async ({ page }) => {
    await page.goto('/publish');
    
    // Fill in some fields
    await page.fill('input[name="namespace"]', 'test');
    await page.fill('input[name="name"]', 'mypackage');
    
    // Click reset button
    await page.click('text=Reset');
    
    // Fields should be cleared
    await expect(page.locator('input[name="namespace"]')).toHaveValue('');
    await expect(page.locator('input[name="name"]')).toHaveValue('');
  });
});

test.describe('Documentation Page', () => {
  test('should display documentation', async ({ page }) => {
    await page.goto('/docs');
    
    // Check for page elements
    await expect(page.locator('h1')).toContainText('Documentation');
    
    // Check for table of contents
    await expect(page.locator('text=Table of Contents')).toBeVisible();
    await expect(page.locator('a:has-text("Getting Started")')).toBeVisible();
    await expect(page.locator('a:has-text("CapRover Setup")')).toBeVisible();
    await expect(page.locator('a:has-text("API Usage")')).toBeVisible();
  });

  test('should have CapRover setup documentation', async ({ page }) => {
    await page.goto('/docs');
    
    // Check for CapRover section
    await expect(page.locator('h2:has-text("CapRover Setup")')).toBeVisible();
    await expect(page.locator('text=CapRover is a free and open-source PaaS')).toBeVisible();
    
    // Check for step-by-step instructions
    await expect(page.locator('text=Create Backend App')).toBeVisible();
    await expect(page.locator('text=Configure Backend')).toBeVisible();
  });

  test('should have API usage examples', async ({ page }) => {
    await page.goto('/docs');
    
    // Check for API usage section
    await expect(page.locator('h2:has-text("API Usage")')).toBeVisible();
    await expect(page.locator('text=Publishing a Package')).toBeVisible();
    await expect(page.locator('text=Downloading a Package')).toBeVisible();
    
    // Check for code examples
    await expect(page.locator('pre code')).toBeVisible();
  });
});

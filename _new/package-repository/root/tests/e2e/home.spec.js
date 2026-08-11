import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Welcome to Good Package Repo');
    
    // Check for subtitle
    await expect(page.locator('text=The world\'s first truly good package repository')).toBeVisible();
    
    // Check for navigation links
    await expect(page.locator('a:has-text("Browse")')).toBeVisible();
    await expect(page.locator('a:has-text("Docs")')).toBeVisible();
  });

  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Browse link in hero section
    await page.locator('text=Browse Packages').first().click();
    
    // Wait for navigation
    await page.waitForURL('**/browse');
    
    // Check that we're on the browse page
    await expect(page.locator('h1')).toContainText('Browse Packages');
  });

  test('should navigate to docs page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Docs link in hero section
    await page.locator('text=Read Docs').first().click();
    
    // Wait for navigation
    await page.waitForURL('**/docs');
    
    // Check that we're on the docs page
    await expect(page.locator('h1')).toContainText('Documentation');
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');
    
    // Check for feature cards
    await expect(page.locator('text=Secure by Design')).toBeVisible();
    await expect(page.locator('text=Lightning Fast')).toBeVisible();
    await expect(page.locator('text=Schema-Driven')).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');
    
    // Check for stats
    await expect(page.locator('text=100%')).toBeVisible();
    await expect(page.locator('text=Uptime')).toBeVisible();
  });
});

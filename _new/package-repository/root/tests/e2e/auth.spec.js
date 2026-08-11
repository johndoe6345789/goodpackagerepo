import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for default credentials hint
    await expect(page.locator('text=Default credentials: admin / admin')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to home page
    await page.waitForURL('/');
    
    // Check that we're on the home page
    await expect(page.locator('h1')).toContainText('Welcome to Good Package Repo');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in login form with wrong password
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Should still be on login page
    await expect(page.url()).toContain('/login');
  });

  test('should navigate to account page when logged in', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to account page
    await page.goto('/account');
    
    // Check account page elements
    await expect(page.locator('h1')).toContainText('Account Settings');
    await expect(page.locator('text=Username')).toBeVisible();
    await expect(page.locator('text=admin')).toBeVisible();
  });

  test('should redirect to login when accessing account page without auth', async ({ page }) => {
    // Try to access account page without logging in
    await page.goto('/account');
    
    // Should be redirected to login
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Go to account page
    await page.goto('/account');
    
    // Click logout button
    await page.click('text=Logout');
    
    // Should be redirected to login page
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('Login');
  });
});

import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the package repository tool.
 * Validates app load and package list rendering.
 */
test.describe('Package Repo Smoke Tests', () => {
  test('app loads successfully', async ({ page }) => {
    const response = await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response?.status()).toBeLessThan(500);
    await expect(
      page.locator('body'),
    ).not.toBeEmpty();
  });

  test('homepage has a valid title', async ({
    page,
  }) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
    });
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('browse page loads', async ({ page }) => {
    const response = await page.goto('/browse', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response?.status()).toBeLessThan(500);
  });

  test('package list renders', async ({ page }) => {
    await page.goto('/browse', {
      waitUntil: 'domcontentloaded',
    });
    const list = page.getByTestId('package-list');
    await expect(list).toBeVisible();
  });

  test('search input exists on browse page', async ({
    page,
  }) => {
    await page.goto('/browse', {
      waitUntil: 'domcontentloaded',
    });
    const search = page.getByTestId(
      'package-search-input',
    );
    await expect(search).toBeVisible();
    await expect(search).toBeEditable();
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/login', {
      waitUntil: 'domcontentloaded',
    });
    const form = page.getByTestId('login-form');
    await expect(form).toBeVisible();
  });

  test('navigation bar renders', async ({ page }) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
    });
    const nav = page.getByTestId('navbar');
    await expect(nav).toBeVisible();
  });

  test('docs page loads', async ({ page }) => {
    const response = await page.goto('/docs', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response?.status()).toBeLessThan(500);
  });
});

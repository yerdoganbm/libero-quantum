/**
 * Auth Strategies: pluggable authentication for mapping
 */

import { Page } from 'playwright';
import { logger } from '@libero/core';

export interface AuthStrategy {
  name: string;
  setup(page: Page, config: any): Promise<void>;
}

export class CookieAuthStrategy implements AuthStrategy {
  name = 'cookie';

  async setup(page: Page, config: { cookies: Array<{ name: string; value: string; domain: string }> }): Promise<void> {
    logger.info('Setting up cookie-based auth');
    await page.context().addCookies(config.cookies);
  }
}

export class LocalStorageAuthStrategy implements AuthStrategy {
  name = 'localStorage';

  async setup(page: Page, config: { token: string; key?: string }): Promise<void> {
    logger.info('Setting up localStorage auth');
    const key = config.key || 'authToken';
    await page.evaluate(
      ({ k, v }) => {
        localStorage.setItem(k, v);
      },
      { k: key, v: config.token }
    );
  }
}

export class LoginFormAuthStrategy implements AuthStrategy {
  name = 'loginForm';

  async setup(page: Page, config: { loginUrl: string; username: string; password: string; usernameSelector?: string; passwordSelector?: string; submitSelector?: string }): Promise<void> {
    logger.info(`Logging in via form at ${config.loginUrl}`);
    
    await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
    
    const usernameSelector = config.usernameSelector || 'input[type="text"], input[type="email"], input[name="username"], input[name="email"]';
    const passwordSelector = config.passwordSelector || 'input[type="password"]';
    const submitSelector = config.submitSelector || 'button[type="submit"], input[type="submit"]';

    await page.locator(usernameSelector).first().fill(config.username);
    await page.locator(passwordSelector).first().fill(config.password);
    await page.locator(submitSelector).first().click();

    // Wait for navigation or token
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(2000);
    
    logger.success('Login complete');
  }
}

export class CustomAuthStrategy implements AuthStrategy {
  name = 'custom';

  async setup(page: Page, config: { scriptPath: string }): Promise<void> {
    logger.info(`Running custom auth script: ${config.scriptPath}`);
    const setupFn = require(config.scriptPath);
    await setupFn(page);
    logger.success('Custom auth complete');
  }
}

export function getAuthStrategy(strategyName: string): AuthStrategy | null {
  const strategies: Record<string, AuthStrategy> = {
    cookie: new CookieAuthStrategy(),
    localStorage: new LocalStorageAuthStrategy(),
    loginForm: new LoginFormAuthStrategy(),
    custom: new CustomAuthStrategy(),
  };
  return strategies[strategyName] || null;
}

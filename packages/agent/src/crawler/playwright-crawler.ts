/**
 * Playwright-based dynamic crawler
 */

import { chromium, type Browser, type Page } from 'playwright';
import { AppNode, AppEdge, ElementDescriptor, FormDescriptor, FormField, ValidationRule } from '@libero/core';
import { logger, hashString, generateId } from '@libero/core';
import { getAuthStrategy } from '../auth/auth-strategies';

export interface CrawlOptions {
  baseUrl: string;
  maxDepth: number;
  maxPages: number;
  timeout: number;
  headless: boolean;
  captureScreenshots: boolean;
  authStrategy?: { name: string; config: any };
  deepFormExtraction?: boolean;
}

export class PlaywrightCrawler {
  private browser: Browser | null = null;
  private visited = new Set<string>();
  private queue: Array<{ url: string; depth: number }> = [];
  private nodes: AppNode[] = [];
  private edges: AppEdge[] = [];

  async crawl(options: CrawlOptions): Promise<{ nodes: AppNode[]; edges: AppEdge[] }> {
    logger.info(`Starting crawl: ${options.baseUrl}`);
    
    this.browser = await chromium.launch({ headless: options.headless });
    const context = await this.browser.newContext();

    // Setup auth if provided
    if (options.authStrategy) {
      const strategy = getAuthStrategy(options.authStrategy.name);
      if (strategy) {
        const authPage = await context.newPage();
        await strategy.setup(authPage, options.authStrategy.config);
        await authPage.close();
        logger.success(`Auth strategy '${options.authStrategy.name}' applied`);
      } else {
        logger.warn(`Unknown auth strategy: ${options.authStrategy.name}`);
      }
    }

    this.queue.push({ url: options.baseUrl, depth: 0 });

    while (this.queue.length > 0 && this.nodes.length < options.maxPages) {
      const item = this.queue.shift()!;
      if (this.visited.has(item.url) || item.depth > options.maxDepth) continue;
      
      await this.crawlPage(item.url, item.depth, options, context);
    }

    await this.browser.close();
    logger.success(`Crawl complete: ${this.nodes.length} pages, ${this.edges.length} edges`);
    
    return { nodes: this.nodes, edges: this.edges };
  }

  private async crawlPage(url: string, depth: number, options: CrawlOptions, context: any): Promise<void> {
    this.visited.add(url);
    logger.debug(`Crawling: ${url} (depth: ${depth})`);

    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options.timeout });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);

      // Extract elements
      const elements = await this.extractElements(page);
      const forms = await this.extractForms(page, options.deepFormExtraction ?? false);
      
      // Create node
      const nodeId = this.normalizeUrl(url);
      const node: AppNode = {
        id: nodeId,
        type: 'route',
        url,
        route: this.extractRoute(url, options.baseUrl),
        name: await this.extractPageName(page),
        elements,
        forms,
        metadata: {
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          visitCount: 1,
        },
      };
      
      this.nodes.push(node);

      // Extract links and add to queue
      if (depth < options.maxDepth) {
        const links = await this.extractLinks(page, options.baseUrl);
        for (const link of links) {
          if (!this.visited.has(link.url)) {
            this.queue.push({ url: link.url, depth: depth + 1 });
            
            // Create edge
            this.edges.push({
              from: nodeId,
              to: this.normalizeUrl(link.url),
              type: 'navigate',
              trigger: link.element,
            });
          }
        }
      }

      // Screenshot (optional)
      if (options.captureScreenshots) {
        await page.screenshot({ path: `.libero/screenshots/${hashString(url)}.png`, fullPage: false }).catch(() => null);
      }

    } catch (error) {
      logger.warn(`Failed to crawl ${url}: ${error}`);
    } finally {
      await page.close();
    }
  }

  private async extractElements(page: Page): Promise<ElementDescriptor[]> {
    const elements: ElementDescriptor[] = [];
    
    const roles = ['button', 'link', 'textbox', 'heading', 'img'];
    for (const role of roles) {
      try {
        const locator = page.getByRole(role as any);
        const count = await locator.count();
        
        for (let i = 0; i < Math.min(count, 20); i++) {
          const el = locator.nth(i);
          const text = await el.textContent().catch(() => '');
          const attrs = await el.evaluate((e) => {
            const result: Record<string, string> = {};
            const attrArray = Array.from(e.attributes);
            for (const attr of attrArray) {
              result[attr.name] = attr.value;
            }
            return result;
          }).catch(() => ({} as Record<string, string>));
          
          const primarySelector = attrs['data-testid'] 
            ? `[data-testid="${attrs['data-testid']}"]`
            : attrs['aria-label']
            ? `[aria-label="${attrs['aria-label']}"]`
            : role === 'heading' && text?.trim()
            ? `h1:has-text("${text.trim()}"), h2:has-text("${text.trim()}"), h3:has-text("${text.trim()}")`
            : role === 'button' && text?.trim()
            ? `button:has-text("${text.trim()}")`
            : role === 'link' && text?.trim()
            ? `a:has-text("${text.trim()}")`
            : `[role="${role}"]`;
          
          elements.push({
            id: generateId('el'),
            role,
            name: text?.trim() || attrs['aria-label'] || attrs['name'] || undefined,
            selector: {
              primary: primarySelector,
              fallbacks: [],
              stability: 0.5,
              type: attrs['data-testid'] ? 'data-testid' : 'css',
            },
            type: role as any,
            attributes: attrs,
            text: text?.trim(),
            placeholder: attrs['placeholder'],
            confidence: 0.8,
          });
        }
      } catch (e) {
        // Role not found
      }
    }
    
    return elements;
  }

  private async extractForms(page: Page, deepFormExtraction: boolean): Promise<FormDescriptor[]> {
    const forms = await page.evaluate((deep) => {
      const extractLabel = (input: Element): string => {
        const htmlInput = input as HTMLInputElement;
        const byLabels = htmlInput.labels?.[0]?.textContent?.trim();
        if (byLabels) return byLabels;

        const id = input.getAttribute('id');
        if (id) {
          const forLabel = document.querySelector(`label[for="${id}"]`);
          if (forLabel?.textContent) return forLabel.textContent.trim();
        }

        const parentLabel = input.closest('label');
        return parentLabel?.textContent?.trim() || '';
      };

      return Array.from(document.querySelectorAll('form')).map((form, formIndex) => {
        const controls = Array.from(form.querySelectorAll('input, textarea, select'));
        const submitBtn =
          form.querySelector('button[type="submit"], input[type="submit"]') ||
          form.querySelector('button:not([type="button"])');

        const getFormSelector = (): string => {
          const testId = form.getAttribute('data-testid');
          if (testId) return `[data-testid="${testId}"]`;
          if (form.id) return `#${form.id}`;
          return `form:nth-of-type(${formIndex + 1})`;
        };

        const fields = controls.map((control, controlIndex) => {
          const el = control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          const rawType = control.tagName.toLowerCase() === 'select' ? 'select' : el.type || 'text';
          const id = el.id || '';
          const name = el.getAttribute('name') || '';
          const placeholder = (el as HTMLInputElement).placeholder || '';
          const testId = el.getAttribute('data-testid') || '';
          const ariaLabel = el.getAttribute('aria-label') || '';
          const label = extractLabel(control);
          const selector = testId
            ? `[data-testid="${testId}"]`
            : id
            ? `#${id}`
            : name
            ? `[name="${name}"]`
            : `${control.tagName.toLowerCase()}:nth-of-type(${controlIndex + 1})`;

          const validationHints = [
            control.getAttribute('aria-invalid') === 'true' ? 'aria-invalid' : '',
            (el as HTMLInputElement).required ? 'required' : '',
            control.getAttribute('pattern') ? 'pattern' : '',
            control.getAttribute('minlength') ? 'minlength' : '',
            control.getAttribute('maxlength') ? 'maxlength' : '',
          ].filter(Boolean);

          const constraints = deep
            ? {
                minLength: (() => {
                  const value = control.getAttribute('minlength');
                  return value != null ? Number(value) : undefined;
                })(),
                maxLength: (() => {
                  const value = control.getAttribute('maxlength');
                  return value != null ? Number(value) : undefined;
                })(),
                min: (() => {
                  const value = control.getAttribute('min');
                  return value != null ? Number(value) : undefined;
                })(),
                max: (() => {
                  const value = control.getAttribute('max');
                  return value != null ? Number(value) : undefined;
                })(),
                pattern: control.getAttribute('pattern') || undefined,
                step: control.getAttribute('step') || undefined,
              }
            : undefined;

          return {
            id: `${formIndex}-${controlIndex}-${name || id || rawType}`,
            tag: control.tagName.toLowerCase(),
            type: rawType,
            name,
            domId: id,
            placeholder,
            required: (el as HTMLInputElement).required || false,
            testId,
            label: label || ariaLabel,
            selector,
            constraints,
            validationHints,
          };
        });

        return {
          id: `${formIndex}-${form.id || form.getAttribute('data-testid') || 'anonymous'}`,
          selector: getFormSelector(),
          testId: form.getAttribute('data-testid') || '',
          domId: form.id || '',
          action: form.getAttribute('action') || '',
          method: form.getAttribute('method') || 'POST',
          fields,
          hasSubmit: Boolean(submitBtn),
          submitLabel: submitBtn?.textContent?.trim() || '',
          submitTestId: submitBtn?.getAttribute('data-testid') || '',
        };
      });
    }, deepFormExtraction);

    return forms.map((form): FormDescriptor => {
      const fields: FormField[] = form.fields.map((field: any) => ({
        name: field.name || field.domId || `field-${field.id}`,
        type: this.mapInputType(field.type, field.tag),
        selector: {
          primary: field.selector,
          fallbacks: field.domId ? [`#${field.domId}`] : field.name ? [`[name="${field.name}"]`] : [],
          stability: field.testId ? 0.95 : field.domId ? 0.8 : 0.6,
          type: field.testId ? ('data-testid' as const) : field.domId ? ('css' as const) : ('label' as const),
        },
        required: Boolean(field.required),
        placeholder: field.placeholder || undefined,
        label: field.label || undefined,
        constraints: field.constraints,
        validationHints: field.validationHints,
      }));

      const submitButton = form.hasSubmit
        ? {
            id: generateId('btn'),
            role: 'button',
            name: form.submitLabel || 'Submit',
            selector: {
              primary: form.submitTestId ? `[data-testid="${form.submitTestId}"]` : `${form.selector} button[type="submit"]`,
              fallbacks: [`${form.selector} input[type="submit"]`, `${form.selector} button:not([type="button"])`],
              stability: form.submitTestId ? 0.95 : 0.7,
              type: form.submitTestId ? ('data-testid' as const) : ('css' as const),
            },
            type: 'button' as const,
            attributes: { type: 'submit' },
            confidence: 0.9,
          }
        : undefined;

      return {
        id: `form-${form.id}`,
        selector: {
          primary: form.selector,
          fallbacks: [],
          stability: form.testId ? 0.95 : form.domId ? 0.8 : 0.6,
          type: form.testId ? ('data-testid' as const) : ('css' as const),
        },
        fields,
        submitButton,
        validationRules: this.inferValidationRules(fields),
        method: String(form.method || 'POST').toUpperCase(),
        action: form.action || undefined,
      };
    });
  }

  private mapInputType(type: string, tag: string): FormField['type'] {
    const map: Record<string, FormField['type']> = {
      email: 'email',
      password: 'password',
      tel: 'tel',
      number: 'number',
      url: 'url',
      date: 'date',
      checkbox: 'checkbox',
      radio: 'radio',
    };

    if (tag === 'select') return 'select';
    if (tag === 'textarea') return 'text';
    return map[type] || 'text';
  }

  private inferValidationRules(fields: FormField[]): ValidationRule[] {
    const rules: ValidationRule[] = [];
    for (const field of fields) {
      if (field.required) {
        rules.push({ field: field.name, rule: 'required' });
      }
      if (field.type === 'email') {
        rules.push({ field: field.name, rule: 'email' });
      }
      if (field.constraints?.minLength != null) {
        rules.push({ field: field.name, rule: 'min', message: String(field.constraints.minLength) });
      }
      if (field.constraints?.maxLength != null) {
        rules.push({ field: field.name, rule: 'max', message: String(field.constraints.maxLength) });
      }
      if (field.constraints?.pattern) {
        rules.push({ field: field.name, rule: 'pattern', message: field.constraints.pattern });
      }
    }
    return rules;
  }

  private async extractLinks(page: Page, baseUrl: string): Promise<Array<{ url: string; element: ElementDescriptor }>> {
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map(a => ({
        href: a.getAttribute('href') || '',
        text: a.textContent?.trim() || '',
        testId: a.getAttribute('data-testid') || '',
      })).filter(l => l.href && !l.href.startsWith('#') && !l.href.startsWith('mailto:'));
    });

    return links.map(link => {
      const fullUrl = this.resolveUrl(link.href, baseUrl);
      if (!fullUrl.startsWith(baseUrl)) return null; // External
      
      return {
        url: fullUrl,
        element: {
          id: generateId('link'),
          role: 'link',
          name: link.text,
          selector: {
            primary: link.testId ? `[data-testid="${link.testId}"]` : link.text ? `a:has-text("${link.text}")` : `a[href="${link.href}"]`,
            fallbacks: [],
            stability: 0.5,
            type: link.testId ? 'data-testid' : 'css',
          },
          type: 'link' as const,
          attributes: { href: link.href },
          text: link.text,
          confidence: 0.7,
        },
      };
    }).filter(Boolean) as Array<{ url: string; element: ElementDescriptor }>;
  }

  private async extractPageName(page: Page): Promise<string> {
    const title = await page.title().catch(() => '');
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    return h1 || title || 'Untitled Page';
  }

  private extractRoute(url: string, baseUrl: string): string {
    return url.replace(baseUrl, '') || '/';
  }

  private normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      return hashString(u.pathname + u.search);
    } catch {
      return hashString(url);
    }
  }

  private resolveUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).href;
    } catch {
      return href;
    }
  }
}

/**
 * Playwright-based dynamic crawler
 */

import { chromium, type Browser, type Page } from 'playwright';
import { AppNode, AppEdge, ElementDescriptor } from '@libero/core';
import { logger, hashString, generateId } from '@libero/core';

export interface CrawlOptions {
  baseUrl: string;
  maxDepth: number;
  maxPages: number;
  timeout: number;
  headless: boolean;
  captureScreenshots: boolean;
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
    this.queue.push({ url: options.baseUrl, depth: 0 });

    while (this.queue.length > 0 && this.nodes.length < options.maxPages) {
      const item = this.queue.shift()!;
      if (this.visited.has(item.url) || item.depth > options.maxDepth) continue;
      
      await this.crawlPage(item.url, item.depth, options);
    }

    await this.browser.close();
    logger.success(`Crawl complete: ${this.nodes.length} pages, ${this.edges.length} edges`);
    
    return { nodes: this.nodes, edges: this.edges };
  }

  private async crawlPage(url: string, depth: number, options: CrawlOptions): Promise<void> {
    this.visited.add(url);
    logger.debug(`Crawling: ${url} (depth: ${depth})`);

    const page = await this.browser!.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options.timeout });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);

      // Extract elements
      const elements = await this.extractElements(page);
      const forms = await this.extractForms(page);
      
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

  private async extractForms(page: Page): Promise<any[]> {
    const forms = await page.evaluate(() => {
      const formElements = Array.from(document.querySelectorAll('form'));
      return formElements.map((form, idx) => {
        const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]') || 
                         form.querySelector('button:not([type="button"])');
        
        const fields = inputs.map(input => {
          const inp = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          return {
            tag: input.tagName.toLowerCase(),
            type: inp.type || 'text',
            name: inp.name || inp.id || '',
            id: inp.id || '',
            placeholder: (inp as HTMLInputElement).placeholder || '',
            required: (inp as HTMLInputElement).required || false,
            testId: input.getAttribute('data-testid') || '',
            label: (input as HTMLInputElement).labels?.[0]?.textContent?.trim() || '',
          };
        });
        
        return {
          index: idx,
          testId: form.getAttribute('data-testid') || '',
          id: form.id || '',
          action: form.action || '',
          method: form.method || 'POST',
          fields,
          hasSubmit: !!submitBtn,
          submitTestId: submitBtn?.getAttribute('data-testid') || '',
        };
      });
    });

    return forms.map((form: any) => {
      const fields = form.fields.map((f: any) => ({
        name: f.name || f.id || `field-${f.tag}-${Math.random().toString(36).slice(2, 8)}`,
        type: this.mapInputType(f.type, f.tag),
        selector: {
          primary: f.testId ? `[data-testid="${f.testId}"]` : f.id ? `#${f.id}` : f.name ? `[name="${f.name}"]` : `${f.tag}[placeholder="${f.placeholder}"]`,
          fallbacks: [],
          stability: 0.6,
          type: f.testId ? 'data-testid' : 'css',
        },
        required: f.required,
        placeholder: f.placeholder,
        label: f.label,
      }));

      const submitButton = form.hasSubmit ? {
        id: generateId('btn'),
        role: 'button',
        name: 'Submit',
        selector: {
          primary: form.submitTestId ? `[data-testid="${form.submitTestId}"]` : `button[type="submit"]`,
          fallbacks: [],
          stability: 0.7,
          type: form.submitTestId ? 'data-testid' : 'css',
        },
        type: 'button' as const,
        attributes: { type: 'submit' },
        confidence: 0.9,
      } : undefined;

      return {
        id: generateId('form'),
        selector: {
          primary: form.testId ? `[data-testid="${form.testId}"]` : form.id ? `#${form.id}` : `form:nth-of-type(${form.index + 1})`,
          fallbacks: [],
          stability: 0.6,
          type: form.testId ? 'data-testid' : 'css',
        },
        fields,
        submitButton,
        validationRules: this.inferValidationRules(fields),
      };
    });
  }

  private mapInputType(type: string, tag: string): any {
    const map: Record<string, any> = {
      'email': 'email',
      'password': 'password',
      'tel': 'tel',
      'number': 'number',
      'url': 'url',
      'date': 'date',
      'checkbox': 'checkbox',
      'radio': 'radio',
    };
    if (tag === 'select') return 'select';
    if (tag === 'textarea') return 'text';
    return map[type] || 'text';
  }

  private inferValidationRules(fields: any[]): any[] {
    const rules: any[] = [];
    for (const field of fields) {
      if (field.required) {
        rules.push({ field: field.name, rule: 'required' });
      }
      if (field.type === 'email') {
        rules.push({ field: field.name, rule: 'email' });
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

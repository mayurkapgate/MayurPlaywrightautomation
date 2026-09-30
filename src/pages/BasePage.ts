import { Page, Locator } from "@playwright/test";


export class BasePage {

    protected readonly page: Page;

    //common locators across all pages:
    protected readonly logo: Locator;
    protected readonly searchBox: Locator;
    protected readonly searchIcon: Locator;
    protected readonly footerLinks: Locator;
    protected readonly currency: Locator;
    protected readonly cartButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.logo = page.getByRole('img', { name: 'naveenopencart' });
        this.searchBox = page.getByRole('textbox', { name: 'Search' });
        this.searchIcon = page.locator('div#search button');
        this.currency = page.locator('#form-currency');
        this.cartButton = page.locator('div#cart button');
        this.footerLinks = page.locator('footer a');
    }

    //App common features/actions: footer, logo, search

    async isLogoVisible(): Promise<boolean> {
        await this.logo.waitFor({ state: 'visible' });
        return await this.logo.isVisible();
    }

    async isSearchBoxVisible(): Promise<boolean> {
        await this.searchBox.waitFor({ state: 'visible' });
        return await this.searchBox.isVisible();
    }

    async isCurrencyVisible(): Promise<boolean> {
        await this.currency.waitFor({ state: 'visible' });
        return await this.currency.isVisible();
    }

    async isCartButtonVisible(): Promise<boolean> {
        await this.cartButton.first().waitFor({ state: 'visible' });
        return await this.cartButton.first().isVisible();
    }

    async getPageFootersCount(): Promise<number> {
        await this.footerLinks.first().waitFor({ state: 'visible' });
        return await this.footerLinks.count();
    }

    async getPageFooters(): Promise<string[]> {
        await this.footerLinks.waitFor({ state: 'visible' });
        return await this.footerLinks.allInnerTexts();
    }


    //page level generic methods:
    async getPageTitle(): Promise<string> {
        return await this.page.title();
    }


    getPageCurrenURL(): string {
        return this.page.url();
    }


    async waitForPageLoad() {
        await this.page.waitForLoadState('load');
    }

    async takeScreenshot(name: string) {
        return await this.page.screenshot({
            fullPage: true,
            path: `reports/screenshot/${name}.png`
        })
    }


}
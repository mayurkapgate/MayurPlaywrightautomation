
import { test, expect } from '../src/fixtures/pagefixtures';
import { CsvHelper } from '../src/utils/CsvHelper';

test.beforeEach(async ({ loginPage }) => {
    await loginPage.goToLoginPage();
    await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
});


//data provider:
let productData = CsvHelper.readCsv('src/testdata/product.csv');
for (let row of productData) {
    test(`@regression verify search results count - ${row.searchkey} - ${row.productname}`, async ({ homePage, searchResultsPage }) => {
        await homePage.doSearch(row.searchkey);
        let actResultCount = await searchResultsPage.getProductSearchResultsCount();
        console.log('Search Results Count: ', actResultCount);
        expect(actResultCount).toBe(Number(row.resultcount));
    });
}

for (let row of productData) {
    test(`@smoke verify user is able to land on the product page - ${row.searchkey} - ${row.productname}`, async ({ homePage, searchResultsPage, productInfoPage }) => {
        await homePage.doSearch(row.searchkey);
        await searchResultsPage.selectProduct(row.productname);
        expect(await productInfoPage.getProductHeader()).toBe(row.productname);
    });
}



//common features test:
test('@smoke App logo exists on Login Page', async ({ basePage }) => {
    expect(await basePage.isLogoVisible()).toBeTruthy();
});

test('@smoke Search Box exists on Login Page', async ({ basePage }) => {
    expect(await basePage.isSearchBoxVisible()).toBeTruthy();
});

test('@smoke Cart exists on Login Page', async ({ basePage }) => {
    expect(await basePage.isCartButtonVisible()).toBeTruthy();
});

test('@smoke Footers exists on Login Page', async ({ basePage }) => {
    expect(await basePage.getPageFootersCount()).toBe(16);
});
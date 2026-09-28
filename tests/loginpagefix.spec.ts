import { CsvHelper } from '../src/utils/CsvHelper';
import { ExcelHelper } from '../src/utils/ExcelHelper';
import { JsonHelper } from '../src/utils/JsonHelper';


import { test, expect } from '../src/fixtures/pagefixtures';
import * as allure from "allure-js-commons";
import { meta, log, testData } from 'reporting-labs';

test.beforeEach(async ({ loginPage }) => {
    await loginPage.goToLoginPage();
});

//AAA
test('login page title test', async ({ loginPage }) => {
    meta({ priority: 'P2', severity: 'minor', owner: 'Naveen', story: 'US101', epic: 'ep300', feature: 'F30', issue: 'bug34' });

    let pageTitle = await loginPage.getPageTitle();
    console.log('Login page title : ', pageTitle);

    await log('Login page title : ', pageTitle);
    expect(pageTitle).toBe('Account Login');
});

test('forgot pwd link exist test', async ({ loginPage }) => {
    meta({ priority: 'P1', severity: 'critical', owner: 'Himanshu', story: 'US102', epic: 'ep300', feature: 'F31', issue: 'bug35' });

    expect(await loginPage.isForgottenPwdLinkExist()).toBeTruthy();
});

test('user is able to login to app with valid credentials', async ({ loginPage, homePage }) => {

    meta({ priority: 'P1', severity: 'blocker', owner: 'Manish', story: 'US102', epic: 'ep300', feature: 'F31', issue: 'bug35' });
    await testData({ username: process.env.USERNAME!, password: process.env.PASSWORD! }, 'Login');

    await allure.suite("Login Tests");
    await allure.severity("critical");
    await allure.feature("Authentication");
    await allure.story("Valid Login");
    await allure.description("Verify user can login with valid credentials");

    await allure.step("Login with valid creds", async () => {
        await loginPage.doLogin(process.env.USERNAME!, process.env.PASSWORD!);
    });

    await allure.step("Verify logout link is visible", async () => {
        expect.soft(await homePage.isLogoutLinkExist()).toBeTruthy();
    });

    await allure.step("Verify logout home page title is visible", async () => {
        expect.soft(await homePage.getHomePageTitle()).toBe('My Account');
    });

});


//DD_0: using test data from fixtures: sequence run
test(`login to app with invalid credentials with fixture data`, async ({ loginPage, testData }) => {
    for (let row of testData) {
        await loginPage.doLogin(row.username, row.password);
        expect(await loginPage.isInvalidLoginErrorDisplayed()).toBeTruthy();

    }
});


//pros:
// light weight, easy to maintain/read, 3rd party lib, no license, flat files, fs, good for large set of test data
//DD_1: read csv data directly fromn the CSV file and loop the test method row wise...
let testCSVData = CsvHelper.readCsv('src/testdata/logindata.csv');
for (let row of testCSVData) {
    test(`login to app with invalid credentials with CSV data - ${row.username} - ${row.password}`, async ({ loginPage, homePage }) => {

        meta({ priority: 'P2', severity: 'major', owner: 'Ajit', story: 'US103', epic: 'ep301', feature: 'F32', issue: 'bug36' });
        await testData(testCSVData, 'Invalid Login Data');

        await loginPage.doLogin(row.username, row.password);
        expect(await loginPage.isInvalidLoginErrorDisplayed()).toBeTruthy();
    });
};

//cons:
//1. maintenance
//2. MS Licenses
//DD_2: read xlsx data directly fromn the excel file and loop the test method row wise...
let testExcelData = ExcelHelper.readExcel('src/testdata/opencarttestdata.xlsx', 'login');
for (let row of testExcelData) {
    test(`login to app with invalid credentials with Excel Data- ${row.username} - ${row.password}`, async ({ loginPage, homePage }) => {
        meta({ priority: 'P2', severity: 'major', owner: 'Ajit', story: 'US103', epic: 'ep301', feature: 'F32', issue: 'bug36' });
        await testData(testExcelData, 'Invalid Login Data');

        await loginPage.doLogin(row.username, row.password);
        expect(await loginPage.isInvalidLoginErrorDisplayed()).toBeTruthy();
    });
};

//Pros:
//1. inbuilt method: parse, lightweight, smaller data source
//DD_3: read JSON data directly fromn the JSON file and loop the test method row wise...
let testJSONData = JsonHelper.readJson('src/testdata/logindata.json');
for (let row of testJSONData) {
    test(`login to app with invalid credentials with JSON Data- ${row.username} - ${row.password}`, async ({ loginPage, homePage }) => {
        meta({ priority: 'P2', severity: 'major', owner: 'Ajit', story: 'US103', epic: 'ep301', feature: 'F32', issue: 'bug36' });
        await testData(testJSONData, 'Invalid Login Data');

        await loginPage.doLogin(row.username, row.password);
        expect(await loginPage.isInvalidLoginErrorDisplayed()).toBeTruthy();
    });
};


//common features test:
test('App logo exists on Login Page', async ({ basePage }) => {
    expect(await basePage.isLogoVisible()).toBeTruthy();
});

test('Search Box exists on Login Page', async ({ basePage }) => {
    expect(await basePage.isSearchBoxVisible()).toBeTruthy();
});

test('Cart exists on Login Page', async ({ basePage }) => {
    expect(await basePage.isCartButtonVisible()).toBeTruthy();
});

test('Footers exists on Login Page', async ({ basePage }) => {
    expect(await basePage.getPageFootersCount()).toBe(16);
});
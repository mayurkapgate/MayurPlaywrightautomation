

import { test, expect, request, APIResponse } from '@playwright/test';

let AUTH_TOKEN = {
    Authorization: 'Bearer 1d845aa4bebcdb0fea690adf59de3b6fb715af4f80c5eb86c3556abc69909d81'
};

test('get all users GET api test', async ({ request }) => {

    let response: APIResponse = await request.get('https://gorest.co.in/public/v2/users', {
        headers: AUTH_TOKEN
    });
    //console.log(response);
    let jsonBody = await response.json();
    console.log(jsonBody);
    console.log(response.status());
    console.log(response.statusText());

    expect(response.status()).toBe(200);

});


test('create a user POST api test', async ({ request }) => {

    //User JS Object:
    let userData = {
        name: 'manish',
        email: `pwautomation_${Date.now()}@open.com`,
        gender: 'male',
        status: 'active'
    }
    //JS Object ---> JSON (Serialization)
    //JSON.stringify();

    let response = await request.post('https://gorest.co.in/public/v2/users', {
        headers: AUTH_TOKEN,
        data: userData
    });

    let jsonBody = await response.json();
    console.log(jsonBody);
    console.log(response.status());//201
    console.log(response.statusText());//Created

    expect(response.status()).toBe(201);

});



test('update a user PUT api test', async ({ request }) => {

    //User JS Object:
    let userData = {
        name: 'manish lalwani',
        email: 'mainshapiautomation12@open.com',
        gender: 'male',
        status: 'inactive'
    }
    //JS Object ---> JSON (Serialization)
    //JSON.stringify();

    let response = await request.put('https://gorest.co.in/public/v2/users/8616259', {
        headers: AUTH_TOKEN,
        data: userData
    });

    let jsonBody = await response.json();
    console.log(jsonBody);
    console.log(response.status());//200
    console.log(response.statusText());//OK

    expect(response.status()).toBe(200);

});


test('delete a user DELETE api test', async ({ request }) => {

    let response = await request.delete('https://gorest.co.in/public/v2/users/8616267', {
        headers: AUTH_TOKEN,
    });

    console.log(response.status());//204
    console.log(response.statusText());//No Content

    expect(response.status()).toBe(204);

});
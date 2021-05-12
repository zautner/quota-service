/* eslint-disable no-undef */
require("dotenv").config();
const request = require("supertest");
const { app } = require("../app");

// without ping the server can't run on our servers.

describe("Test basics endpoints", () => {
    const req = request(app);
    test("Test ping", async () => {
        await req
            .get("/ping")
            .expect(200)
            .then(async (response) => {
                expect(response?.body?.payload).toEqual('pong')
            });
    });
    
    test("Test info", async () => {
        await req
            .get("/info")
            .expect(200);
    });
    
    test("Test version", async () => {
        await req
            .get("/version")
            .expect(200);
    });
});

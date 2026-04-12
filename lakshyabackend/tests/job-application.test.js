const request = require("supertest");
const { app } = require("../app");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongo) {
    await mongo.stop();
  }
});

describe("Job Application API Test", () => {
  it("should have a ping endpoint", async () => {
    const res = await request(app).get("/ping");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 401 for unauthorized application route", async () => {
    const res = await request(app).get("/api/applications/my-applications");
    expect(res.statusCode).toBe(401);
  });

  it("should return 404 for non-existent public route", async () => {
    const res = await request(app).get("/api/public/non-existent-route-123");
    expect(res.statusCode).toBe(404);
  });
});
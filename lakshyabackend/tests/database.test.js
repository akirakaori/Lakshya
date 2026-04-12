const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

// Sample schema (dummy for testing)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe("Database Test", () => {
  it("should connect to in-memory database", () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("should save user to database", async () => {
    const user = new User({
      name: "Susoban",
      email: "susoban@test.com"
    });

    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe("Susoban");
  });
});
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("./models/User"));
async function seed() {
    await mongoose_1.default.connect("mongodb://admin:adminpass@localhost:27017/beach?authSource=admin");
    const hashedPassword = await bcrypt_1.default.hash("123456", 10);
    const user = await User_1.default.create({
        name: "Test",
        email: "test@test.com",
        password: hashedPassword,
    });
    console.log("✅ Utente creato:", user.email);
    process.exit(0);
}
seed();

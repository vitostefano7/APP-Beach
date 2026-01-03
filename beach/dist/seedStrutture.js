"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Strutture_1 = __importDefault(require("./models/Strutture"));
async function seed() {
    await mongoose_1.default.connect("mongodb://admin:adminpass@localhost:27017/beach?authSource=admin");
    await Strutture_1.default.deleteMany({});
    await Strutture_1.default.insertMany([
        {
            name: "Beach Arena Milano",
            description: "Campi beach volley indoor",
            pricePerHour: 30,
            location: {
                address: "Via Milano 10",
                city: "Milano",
                lat: 45.4642,
                lng: 9.19,
            },
            owner: "693d71ad3fdfa00009982553",
        },
        {
            name: "Beach Club Milano",
            description: "Campi beach volley indoor",
            pricePerHour: 30,
            location: {
                address: "Corso Vittorio Emanuele 10",
                city: "Milano",
                lat: 45.4646,
                lng: 9.29,
            },
            owner: "693d71ad3fdfa00009982553",
        },
        {
            name: "Beach Arena Novara",
            description: "Campi beach volley indoor",
            pricePerHour: 30,
            location: {
                address: "Via Novara 10",
                city: "Novara",
                lat: 45.2700,
                lng: 8.38,
            },
            owner: "693d71ad3fdfa00009982553",
        },
        {
            name: "Sun Beach Roma",
            description: "Beach volley all'aperto",
            pricePerHour: 25,
            location: {
                address: "Via del Mare 5",
                city: "Roma",
                lat: 41.9028,
                lng: 12.4964,
            },
            owner: "693d71ad3fdfa00009982553",
        },
    ]);
    console.log("Strutture inserite ✔");
    process.exit();
}
seed();

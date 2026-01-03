"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerBookings = exports.updateStruttura = exports.getMyStrutture = exports.createStruttura = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Strutture_1 = __importDefault(require("../models/Strutture"));
const Booking_1 = __importDefault(require("../models/Booking"));
/**
 * CREA STRUTTURA
 */
const createStruttura = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const struttura = await Strutture_1.default.create({
            ...req.body,
            owner: new mongoose_1.default.Types.ObjectId(ownerId),
            location: {
                ...req.body.location,
                coordinates: [
                    req.body.location.lng,
                    req.body.location.lat,
                ],
            },
        });
        res.status(201).json(struttura);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Errore creazione struttura" });
    }
};
exports.createStruttura = createStruttura;
/**
 * STRUTTURE OWNER
 */
const getMyStrutture = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const strutture = await Strutture_1.default.find({
            owner: new mongoose_1.default.Types.ObjectId(ownerId),
            isDeleted: false,
        });
        res.json(strutture);
    }
    catch (err) {
        res.status(500).json({ message: "Errore" });
    }
};
exports.getMyStrutture = getMyStrutture;
/**
 * UPDATE STRUTTURA
 */
const updateStruttura = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { id } = req.params;
        const struttura = await Strutture_1.default.findOne({
            _id: id,
            owner: new mongoose_1.default.Types.ObjectId(ownerId),
        });
        if (!struttura) {
            return res.status(404).json({ message: "Struttura non trovata" });
        }
        Object.assign(struttura, req.body);
        if (req.body.location?.lat && req.body.location?.lng) {
            struttura.location.coordinates = [
                req.body.location.lng,
                req.body.location.lat,
            ];
        }
        await struttura.save();
        res.json(struttura);
    }
    catch (err) {
        res.status(500).json({ message: "Errore update" });
    }
};
exports.updateStruttura = updateStruttura;
/**
 * PRENOTAZIONI OWNER
 */
const getOwnerBookings = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const strutture = await Strutture_1.default.find({
            owner: new mongoose_1.default.Types.ObjectId(ownerId),
        }).select("_id");
        const ids = strutture.map(s => s._id);
        const bookings = await Booking_1.default.find({
            struttura: { $in: ids },
            status: "confirmed",
        })
            .populate("user", "name email")
            .populate("struttura", "name location");
        res.json(bookings);
    }
    catch (err) {
        res.status(500).json({ message: "Errore bookings" });
    }
};
exports.getOwnerBookings = getOwnerBookings;

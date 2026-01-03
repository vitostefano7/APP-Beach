"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHalfHourSlots = void 0;
const generateHalfHourSlots = (open, close) => {
    const slots = [];
    let [h, m] = open.split(":").map(Number);
    while (true) {
        const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        if (time >= close)
            break;
        slots.push({ time, enabled: true });
        m += 30;
        if (m >= 60) {
            h++;
            m = 0;
        }
    }
    return slots;
};
exports.generateHalfHourSlots = generateHalfHourSlots;

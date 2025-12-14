import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import struttureRoutes from "./routes/struttureRoutes";
import BookingRoutes from "./routes/bookingRoutes";



const app = express();
app.use(express.json());

async function start() {
  try {
    await mongoose.connect(
      "mongodb://admin:adminpass@localhost:27017/beach?authSource=admin"
    );
    console.log("MongoDB Connected ✔");

    app.get("/", (_req, res) => {
      res.send("Backend Beach Booking API ✔");
    });

    app.use("/auth", authRoutes);
    app.use("/users",userRoutes);
    app.use("/strutture",struttureRoutes);
    app.use("/bookings",BookingRoutes);

    app.listen(3000, () => {
      console.log("Server started on port 3000 ✔");
    });
  } catch (err) {
    console.error("Errore connessione MongoDB ❌", err);
  }
}

start();

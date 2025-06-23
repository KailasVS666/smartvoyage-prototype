import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import itineraryRouter from "./routes/itinerary";
import groupsRouter from './routes/groups';
import admin from "firebase-admin";
import path from "path";
import tripsRouter from './routes/trips';

const app = express();
const port = process.env.PORT || 5000;

// Use the correct path to your service account key file
const serviceAccount = require(path.join(__dirname, "../smartvoyage-c4912-firebase-adminsdk-fbsvc-a81061ab95.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

app.use(cors());
app.use(express.json());

// Mount the itinerary route
app.use("/itinerary", itineraryRouter);
app.use('/groups', groupsRouter);
app.use('/trips', tripsRouter);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 
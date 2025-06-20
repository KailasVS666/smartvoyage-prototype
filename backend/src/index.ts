import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import itineraryRouter from "./routes/itinerary";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount the itinerary route
app.use("/itinerary", itineraryRouter);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 
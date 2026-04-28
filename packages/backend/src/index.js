import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import cron from "node-cron";
import Progress from "./models/progress.models.js";

dotenv.config({ path: "./.env" });

// Weekly progress reset
cron.schedule("0 0 * * 1", async () => {
  try {
    const now = new Date();
    const result = await Progress.updateMany(
      {},
      { $set: { weeklyHours: 0, weeklySessions: 0, weekStart: now } },
    );
    console.log(`Weekly progress reset for ${result.modifiedCount} users`);
  } catch (err) {
    console.error("Weekly reset cron failed:", err);
  }
});

connectDB()
  .then(() => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`⚙️ Server is running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!! ", err);
  });

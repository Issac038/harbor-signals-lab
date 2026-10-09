const crypto = require("crypto");
const express = require("express");
const client = require("prom-client");

const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const checkoutRequests = new client.Counter({
  name: "checkout_requests_total",
  help: "Total checkout requests",
  registers: [register],
});

const checkoutErrors = new client.Counter({
  name: "checkout_errors_total",
  help: "Total failed checkout requests",
  registers: [register],
});

app.get("/", (req, res) => {
  res.status(200).send("Harbor checkout is running");
});

// Adding the health route here
app.get("/health", (req, res) => {
  res.status(200).json({status:"ok"});
});

app.get("/checkout", (req, res) => {
  checkoutRequests.inc();
  if (req.query.fail === "1") {
    checkoutErrors.inc();
    // Change added to the checkout fail === 1
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      required_id: crypto.randomUUID(),
      message:"Checkout failed"
    }));
    return res.status(500).json({ result: "failed" });
  }
  return res.status(200).json({ result: "paid" });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.listen(8080, "0.0.0.0", () => {
  console.log("listening on 8080");
});

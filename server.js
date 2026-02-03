const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "https://trackierpanel.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow Postman / curl / server-side
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false); // ❗ DO NOT throw error
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ]
}));

// allow preflight
app.options("*", cors());

app.use(express.json());

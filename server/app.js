const express = require("express");
require("dotenv").config();
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const app = express();

app.use(cors());

// Security measures
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"], // Allow loading scripts from same origin
				//   scriptSrc: ["'self'", "https://trusted-cdn.com"], // Allow scripts from trusted sources
				objectSrc: ["'none'"], // Block Flash/Plugins
			},
		},
		frameguard: { action: "deny" }, // Prevent Clickjacking
		referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // Control Referrer Header
		xssFilter: true, // Prevent XSS Attacks
		dnsPrefetchControl: { allow: false }, // Prevent DNS Prefetching
	})
);

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());

const userRoute = require("./routes/users");
const supplierRoute = require("./routes/suppliers");

app.use("/api/auth", userRoute);
app.use("/api/suppliers", supplierRoute);

module.exports = app;

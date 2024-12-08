import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(), // Log to the console
    // Add other transports like File if needed
  ],
});

export default logger;

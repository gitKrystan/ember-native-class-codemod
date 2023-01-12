import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf } = format;

const logFormatter = printf((info) => {
  return `${info.timestamp} [${info.level}] ${info.message}`;
});

module.exports = createLogger({
  format: combine(timestamp(), logFormatter),
  transports: [new transports.File({ filename: 'codemods.log' })],
});

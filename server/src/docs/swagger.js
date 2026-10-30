const path = require("path");
const fs = require("fs");
const YAML = require("yaml");

const openApiPath = path.join(__dirname, "../../openapi.yaml");

const swaggerSpec = YAML.parse(
  fs.readFileSync(openApiPath, "utf8")
);

module.exports = swaggerSpec;
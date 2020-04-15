const express = require("express");
const basicAuth = require("express-basic-auth");
const bodyParser = require("body-parser");
const log4js = require("log4js");
const watsonAssistant = require("./models/watson-assistant");

const logger = log4js.getLogger("app");
logger.level = "debug";

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(basicAuth({
    users: { "admin": "password" },
    unauthorizedResponse: function () {
        logger.error("Not authorized");
        return "Not authorized.";
    }
}));


app.get("/v1/deployments", function (req, res) {
    res.send({
        "count": 1,
        "resources": [
            {
                "metadata": {
                    "guid": "3e23b024-80a9-466a-b007-69e68995d1bb",
                    "created_at": "2020-04-07T17:37:07.3891381Z",
                    "modified_at": "2020-04-07T17:37:18.1790311Z"
                },
                "entity": {
                    "name": "Custom Watson Assistant Wrapper -  Deployment",
                    "type": "online",
                    "scoring_endpoint": {
                        "url": `https://${req.hostname}/v1/deployments/3e23b024-80a9-466a-b007-69e68995d1bb/online`
                    },
                    "asset": {
                        "guid": "1805e551-2e01-4596-93a4-858f64006c36",
                        "name": "Custom Watson Assistant Wrapper",
                    },
                    "asset_properties": {
                    }
                }
            }
        ]
    });
});

app.post("/v1/deployments/3e23b024-80a9-466a-b007-69e68995d1bb/online", function (req, res) {
    watsonAssistant.score(req, res);
});

const PORT = process.env.PORT || 5000;
var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;
    logger.info("Example app listening at http://%s:%s", host, port);
});
const log4js = require("log4js");
const _ = require("lodash");
const logger = log4js.getLogger("watson-assistant");
logger.level = "debug";
const mapLimit = require("async/mapLimit");
const AssistantV2 = require("ibm-watson/assistant/v2");
const { IamAuthenticator } = require("ibm-watson/auth");

function create_session(assistant) {
    return assistant.createSession({
        assistantId: process.env.WATSON_ASSISTANT_ID
    }).then((response) => {
        logger.info("Got the WA Session ID");
        return Promise.resolve(response.result.session_id);
    }).catch((error) => {
        logger.error(JSON.stringify(error));
        return Promise.reject();
    });
}

function individual_score(assistant, session_id, utterance, req, retries = 3) {
    return assistant.message({
        assistantId: process.env.WATSON_ASSISTANT_ID,
        sessionId: session_id,
        input: {
            text: utterance,
            options: {
                alternate_intents: true
            }
        }
    }).then(response => {
        return Promise.resolve(manipulate(utterance, response.result));
    }).catch((error) => {

        if (retries > 0) {
            let values = req.body.values.map(val => val[0]);
            logger.warn(`Failed in ${values.indexOf(utterance)}th iteration. Retrying again.`);
            return individual_score(assistant, session_id, utterance, req, retries - 1);
        }
        logger.error(JSON.stringify(error));
        return Promise.reject();
    });
}

/**
 * Converts Watson Assistant result to Watson OpenScale compatible format
 * @param {string} utterance 
 * @param {object} result 
 */
function manipulate(utterance, result) {
    try {
        let values = [utterance];
        values.push(result.output.intents[0].intent);
        let probabilities = _.sortBy(result.output.intents, "intent").map(intent => intent.confidence);
        let sum = probabilities.reduce((a, b) => a + b, 0);
        values.push(probabilities.map(prob => prob / sum));
        return values;
    } catch (error) {
        logger.error(JSON.stringify(error));
    }
}

function score(req, res) {
    if (!process.env.WATSON_ASSISTANT_APIKEY) {
        res.status(500).send("Watson Assistant API key is not present in environment");
        return;
    }

    const assistant = new AssistantV2({
        version: "2020-04-01",
        authenticator: new IamAuthenticator({
            apikey: process.env.WATSON_ASSISTANT_APIKEY,
        }),
        url: process.env.WATSON_ASSISTANT_API_URL,
    });
    try {
        create_session(assistant).then(async (session_id) => {
            mapLimit(req.body.values, 500, async value => individual_score(assistant, session_id, value[0], req), (err, results) => {
                if (err) {
                    logger.error(JSON.stringify(err));
                    res.status(500).send(err);
                    return;
                }
                logger.info(JSON.stringify(results));
                res.send({
                    fields: req.body.fields.concat(["top_intent", "confidence"]),
                    values: results
                });
            });
        }).catch((error) => {
            res.status(500).send(error);
        });
    } catch (error) {
        logger.error(JSON.stringify(error));
    }
}

module.exports = {
    score
};
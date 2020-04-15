const log4js = require("log4js");
const _ = require("lodash");
const logger = log4js.getLogger("watson-assistant");
logger.level = "debug";
const mapLimit = require("async/mapLimit");
const AssistantV2 = require("ibm-watson/assistant/v2");
const { IamAuthenticator } = require("ibm-watson/auth");

const WATSON_ASSISTANT_ID = "db3960e3-eb1e-47b6-865d-cddb7c0c3db4";


function create_session(assistant) {
    return assistant.createSession({
        assistantId: WATSON_ASSISTANT_ID
    }).then((response) => {
        logger.info("Got the WA Session ID");
        return Promise.resolve(response.result.session_id);
    }).catch((error) => {
        logger.error(JSON.stringify(error));
        return Promise.reject();
    });
}

function individual_score(assistant, session_id, utterance, req, retries = 3) {
    console.log(JSON.stringify({
        input: {
            text: utterance,
            options: {
                alternate_intents: true
            }
        }
    }));
    return assistant.message({
        assistantId: WATSON_ASSISTANT_ID,
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
        console.log(JSON.stringify(result, 4));
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
        url: "https://api.us-south.assistant.watson.cloud.ibm.com/instances/25e8f139-6ddb-44f9-84f7-a1e3340cc9fa",
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
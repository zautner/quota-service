const glob = require('glob');
const { rapidMetrics, CommonRegExp } = require('@rapidapi/rapid-metrics');
const path = require('path');
const Express = require('express');
const cluster = require("cluster");
const { RapidLogger } = require('@rapidapi/rapid-logger')
const bodyParser = require("body-parser");
const compression = require("compression");
const version = require("./package.json").version;
const { SINGLE_PROCESS_DEPLOYMENT_STRATEGIES } = require('./utils/enums');

const app = new Express();
const NODE_ENV = process.env.NODE_ENV || "localhost";

const quotaRoutes = router => {
    router.get("/ping", (req, res) => {
        res.status(200)
            .send({ payload: "pong" });
    });

    router.get("/version", (req, res) => {
        res.status(200).send({ version: process.env.BUILD_VERSION });
    })

    router.get("/info", (req, res) => {
        res.status(200)
            .send({ version });
    });
    if (process.env.NODE_ENV !== "production") {
        router.get("/envs", (req, res) => {
            const envs = { ...process.env }; //clone the object
            const filteredEnvs = Object.keys(envs).filter(key => {
                const lowerKey = key.toLowerCase();
                return !['password', 'token'].some(cur => lowerKey.indexOf(cur) !== -1);
            }).reduce((res, key) => (res[key] = envs[key], res), {});
            res.status(200)
                .send({ envs: filteredEnvs });
        });
    }

    const controllersRegistrators =
        glob.sync(path.join(__dirname, 'modules/**/*.routes.js'))
            .map(controllerPath => require(controllerPath))

    for (const registerController of controllersRegistrators) {
        registerController(router);
    }


    return router;
};

app.use(function finisher(req, res, next) {
    res.on("error", function errorLog() {
        global.logger.error(`REQUEST WITH ERROR: ${req.url}`);
    });
    res.on("timeout", function toLog() {
        global.logger.error(`REQUEST WITH TIMEOUT: ${req.url}`);
    });
    res.on("finish", function finisherLog() {
        if (!["\/ping", "\/metrics"].some(curr => req.url.toString().indexOf(curr) >= 0)) {
            global.logger.info(`REQUEST FINISHED: ${req.url}`);
        }
    });
    res.on("response", function toLog() {
        global.logger.info(`REQUEST WITH RESPOND: ${req.url}`);
    });
    next();
});

global.logger = RapidLogger.createLogger({
    nodeEnv: process.env.RUN_LOCAL ? 'development' : 'production',
    serviceName: process.env.SERVICE_NAME || 'Quota',
    logLevel: process.env.LOG_LEVEL || "debug",
});

rapidMetrics.init({
    metricsApp: app,
    serviceName: process.env.SERVICE_NAME || 'Quota',
    extraMasks: [
        CommonRegExp.API_ID,
        CommonRegExp.BILLING_ITEM,
        // will be removed after quota service will take his place
        { regex: new RegExp(/(^\/subscription\/[^\/]+\/quotas\/[^\/]+$)/), replaceWith: '/subscription/#val/quotas/#val' },
        { regex: new RegExp(/(^\/subscription\/[^\/]+\/quota\/[^\/]+$)/), replaceWith: '/subscription/#val/quota/#val' },
        { regex: new RegExp(/(^\/subscription\/[^\/]+\/quota\/[^\/]+\/invoice$)/), replaceWith: '/subscription/#val/quota/#val/invoice' },
        { regex: new RegExp(/(^\/subscription\/[^\/]+\/quotas$)/), replaceWith: '/subscription/#val/quotas' },
        { regex: new RegExp(/(^\/subscription\/[^\/]+\/invoice$)/), replaceWith: '/subscription/#val/invoice' },
        { regex: new RegExp(/(^\/subscription\/[^\/]+\/usage$)/), replaceWith: '/subscription/#val/usage' }
    ]
});

if (
    SINGLE_PROCESS_DEPLOYMENT_STRATEGIES.includes(process.env.DEPLOYMENT_STRATEGY)
    || !cluster.isMaster
    || NODE_ENV === "test"
) {
    app.use(compression());
    app.use(bodyParser.json());
    app.use(quotaRoutes(Express.Router()));
}

module.exports = { app };

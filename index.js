const cluster = require('cluster');
const { app } = require('./app.js');
const numCPUs = require("os").cpus().length;
const { SINGLE_PROCESS_DEPLOYMENT_STRATEGIES } = require('./utils/enums');

if (require.main === module && app) {
    const port = process.env.PORT;

    const NODE_ENV = process.env.NODE_ENV || "localhost";
    // add exception handler to prevent crash from newrelic errors
    if (NODE_ENV !== "test" && NODE_ENV !== "localhost") {
        process.on("uncaughtException", (err) => {
            logger.error('process.on handler catch error - ,', err);
        });
    }
    if (
        !SINGLE_PROCESS_DEPLOYMENT_STRATEGIES.includes(process.env.DEPLOYMENT_STRATEGY)
        && cluster.isMaster
        && NODE_ENV !== "test"
    ) {
        logger.info(`[Quotas] - Master ${process.pid} is running`);

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on("exit", (worker, code, signal) => {
            logger.error(
                `[Quotas] - Worker ${worker.process.pid} died with code ${code} and signal ${signal}`
            );
            logger.info("[Quotas] - Starting a new worker");
            cluster.fork();
        });
    } else {
        try {
            app.listen(port);
            logger.info(`[Quotas] - Running on port ${port}`);
        } catch (err) {
            logger.error(err);
        }
    }
}

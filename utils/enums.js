const minParametersForExternalTable = 51;
// Note. Any env DEPLOYMENT_STRATEGY value will
// trigger rapid-metrics disable cluster capability.
const SINGLE_PROCESS_DEPLOYMENT_STRATEGIES = ["V2"];

module.exports = { minParametersForExternalTable, SINGLE_PROCESS_DEPLOYMENT_STRATEGIES };

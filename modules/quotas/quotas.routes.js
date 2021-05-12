const endpoint = require("../../middlewares/endpoint");
const validator = require("../../middlewares/validator");

const getQuotas = require("./getQuotas");
const getSingleQuota = require("./getSingleQuota");
const getQuotaUsage = require("./getQuotaUsage");
const getInvoiceData = require("./getInvoiceData");
const getQuotasByPeriods = require("./getQuotasByPeriods");

/**
 * @swagger
 * components:
 *  schemas:
 *    BadRequest:
 *      type: object
 *      properties:
 *        value:
 *          type: integer
 *          format: int32
 *        message:
 *          type: object
 *          properties:
 *            title:
 *              type: string
 *            details:
 *              type: string
 *  parameters:
 *    subscriptionQuery:
 *      name: subscription
 *      in: query
 *      description: Subscription ID/s to look for
 *      style: form
 *      explode: false
 *      required: true
 *      schema:
 *        type: array
 *        items:
 *          type: string
 *    quotasQuery:
 *      name: quotas
 *      in: query
 *      description: Quota ID/s to look for
 *      style: form
 *      explode: false
 *      required: false
 *      schema:
 *        type: array
 *        items:
 *          type: string
 *    subscriptionPath:
 *      name: subscription
 *      in: path
 *      description: Subscription ID to look for
 *      required: true
 *      schema:
 *        type: string
 *    quotaPath:
 *      name: quota
 *      in: path
 *      description: Quota ID to look for
 *      required: true
 *      schema:
 *        type: string
 *    fromQuery:
 *      name: from
 *      in: query
 *      description: Date to look from
 *      schema:
 *        type: string
 *        format: date-time
 *        default: 0
 *    toQuery:
 *      name: to
 *      in: query
 *      description: Date to look until
 *      schema:
 *        type: string
 *        format: date-time
 *        default: sysdate
 *    resolutionQuery:
 *      name: resolution
 *      in: query
 *      description: Resolution of time aggregation
 *      schema:
 *        type: string
 *        enum:
 *          - seconds
 *          - minutes
 *          - hours
 *          - days
 *          - months
 *          - years
 *        default: minutes
 *    sortQuery:
 *      name: sort
 *      in: query
 *      description: Sort direction
 *      schema:
 *        type: string
 *        enum:
 *          - asc
 *          - desc
 *        default: asc
 *    groupbyQuotaQuery:
 *      name: groupby
 *      in: query
 *      description: Results grouping option
 *      schema:
 *        type: string
 *        enum:
 *          - subscription
 *          - quota
 */
module.exports = function (app) {
  /**
   * @swagger
   *
   * /quotas:
   *  get:
   *    tags:
   *      - Subscriptions and Quotas
   *    description: Returns data for specified subscriptions and quotas
   *    responses:
   *      '200':
   *        description: Object with data for specified subscriptions and quotas
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *      '400':
   *        description: Bad Request
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/BadRequest'
   *  parameters:
   *    - $ref: '#/components/parameters/subscriptionQuery'
   *    - $ref: '#/components/parameters/quotasQuery'
   *    - $ref: '#/components/parameters/fromQuery'
   *    - $ref: '#/components/parameters/toQuery'
   *    - $ref: '#/components/parameters/resolutionQuery'
   *    - $ref: '#/components/parameters/sortQuery'
   *    - $ref: '#/components/parameters/groupbyQuotaQuery'
   */
  app.get("/quotas",
    validator(getQuotas.validations),
    endpoint(getQuotas.endpoint));

  /**
   * @swagger
   * /subscription/{subscription}/quotas:
   *  get:
   *    tags:
   *      - Subscriptions and Quotas
   *    description: Returns all quotas data for specific subscription
   *    responses:
   *      '200':
   *        description: Object with data for specified subscriptions and quotas
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *      '400':
   *        description: Bad Request
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/BadRequest'
   *  parameters:
   *    - $ref: '#/components/parameters/subscriptionPath'
   *    - $ref: '#/components/parameters/quotasQuery'
   *    - $ref: '#/components/parameters/fromQuery'
   *    - $ref: '#/components/parameters/toQuery'
   *    - $ref: '#/components/parameters/resolutionQuery'
   *    - $ref: '#/components/parameters/sortQuery'
   *    - $ref: '#/components/parameters/groupbyQuotaQuery'
   */
  app.get("/subscription/:subscription/quotas",
    validator(getQuotas.validations),
    endpoint(getQuotas.endpoint));

  /**
   * @deprecated
   */
  app.get("/subscription/:subscription/quotas/:quotas",
    validator(getQuotas.validations),
    endpoint(getQuotas.endpoint));

  /**
   * @swagger
   * /subscription/{subscription}/quota/{quota}:
   *  get:
   *    tags:
   *      - Subscriptions and Quotas
   *    description: Returns specific quota data for specific subscription
   *    responses:
   *      '200':
   *        description: Object with data for specified subscriptions and quotas
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *      '400':
   *        description: Bad Request
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/BadRequest'
   *  parameters:
   *    - $ref: '#/components/parameters/subscriptionPath'
   *    - $ref: '#/components/parameters/quotaPath'
   *    - $ref: '#/components/parameters/fromQuery'
   *    - $ref: '#/components/parameters/toQuery'
   *    - $ref: '#/components/parameters/resolutionQuery'
   *    - $ref: '#/components/parameters/sortQuery'
   *    - $ref: '#/components/parameters/groupbyQuotaQuery'
   */
  app.get("/subscription/:subscription/quota/:quota",
    validator(getSingleQuota.validations),
    endpoint(getSingleQuota.endpoint));

  /**
   * @swagger
   * /subscription/{subscription}/usage:
   *  get:
   *    tags:
   *      - Subscriptions and Quotas
   *    description: Returns quota usage for specific subscription
   *    responses:
   *      '200':
   *        description: Object with quota usage for specific subscription and all/specific quotas
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *      '400':
   *        description: Bad Request
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/BadRequest'
   *  parameters:
   *    - $ref: '#/components/parameters/subscriptionPath'
   *    - $ref: '#/components/parameters/quotasQuery'
   */
  app.get("/subscription/:subscription/usage",
    validator(getQuotaUsage.validations),
    endpoint(getQuotaUsage.endpoint));

  app.get("/subscription/:subscription/quota/:quota/invoice",
    validator(getInvoiceData.validations),
    endpoint(getInvoiceData.endpoint));

  app.get("/subscription/:subscription/invoice",
    validator(getInvoiceData.validations),
    endpoint(getInvoiceData.endpoint));

  
  app.get("/subscription/:subscription/quota/:quota/periods",
    validator(getQuotasByPeriods.validations),
    endpoint(getQuotasByPeriods.endpoint));
};

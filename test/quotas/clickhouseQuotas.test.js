const logger = require("../../utils/logger");
const getQuotas = require('../../modules/quotas/getQuotas');
const getSingleQuota = require('../../modules/quotas/getSingleQuota');
const getInvoiceData = require('../../modules/quotas/getInvoiceData');
const getQuotaByPeriods = require('../../modules/quotas/getQuotasByPeriods');
const Clickhouse = require('../../DAO/Clickhouse');
let addedQuotas = [];
global.logger = logger;

beforeAll(async (done) => {
    addedQuotas = await initializeDB();
    const all = await getAllQuotas()
    done();
});

afterAll(async () => {
    await dropDb();
});

describe('test endpoints for clickhouse data', () => {
    test('getSingleQuota', async () => {
        const selectdQuota = addedQuotas[0];
        const req = {
            query: {
                from: '2020-10-10 00:00:00',
                to: '2020-10-10 13:00:00',
                resolution: 'minutes',
            },
            params: {
                subscription: selectdQuota.subscriptionid,
                quota: selectdQuota.quotaid,
            }
        }
        const res = await getSingleQuota.endpoint(req);
        expect(res.status).toEqual(200);
        expect(res.data['2020-10-10 12:00'].length).toEqual(1);
        expect(res.data['2020-10-10 12:00'][0].quotaid).toEqual(selectdQuota.quotaid);
    });

    test('getQuotas', async () => {
        const selectdQuota = addedQuotas[0];
        const req = {
            query: {
                from: '2020-10-10 00:00:00',
                to: '2020-10-10 13:00:00',
                resolution: 'minutes',
            },
            params: {
            }
        }
        const res = await getQuotas.endpoint(req);
        expect(res.status).toEqual(200);
        expect(res.data['2020-10-10 10:00'].length).toEqual(2);
    });

    test('getInvoiceData with quota', async () => {
        const subscription1Data = addedQuotas.filter(curr => curr.subscriptionid === 'subscription1' && curr.quotaid === 'quotaid1');
        const total = subscription1Data.reduce((acc, curr) => acc += curr.increment, 0);
        const selectdQuota = subscription1Data[0];

        const req = {
            query: {
                from: '2020-10-09 00:00:00',
                to: '2020-10-11 13:00:00',
                resolution: 'days',
            },
            params: {
                subscription: selectdQuota.subscriptionid,
                quota: selectdQuota.quotaid,
            }
        }
        const res = await getInvoiceData.endpoint(req);
        expect(res.status).toEqual(200);
        expect(res.data['2020-10-10 00:00:00'].length).toEqual(1);
        expect(res.data['2020-10-10 00:00:00'][0].subscriptionid).toEqual(selectdQuota.subscriptionid);
        expect(res.data['2020-10-10 00:00:00'][0].quotaid).toEqual(selectdQuota.quotaid);
        expect(res.data['2020-10-10 00:00:00'][0].total).toEqual(total);
    });

    test('getInvoiceData without quota', async () => {
        const subscription1Data = addedQuotas.filter(curr => curr.subscriptionid === 'subscription1');
        const selectdQuota = subscription1Data[0];

        const req = {
            query: {
                from: '2020-10-09 00:00:00',
                to: '2020-10-11 13:00:00',
                resolution: 'days',
            },
            params: {
                subscription: selectdQuota.subscriptionid,
            }
        }
        const res = await getInvoiceData.endpoint(req);
        expect(res.status).toEqual(200);
        expect(res.data['2020-10-10 00:00:00'].length).toEqual(2);
        expect(res.data['2020-10-10 00:00:00'][0].subscriptionid).toEqual(selectdQuota.subscriptionid);
    });

    test('queryByPeriods with quota', async () => {
        const quotaId = 'quotaid5';
        const subscriptionId = 'subscription5';
        const req = {
            query: {
                from: '2020-10-09 00:00:00',
                to: '2021-03-09 13:00:00',
                resolution: 'months',
            },
            params: {
                subscription: subscriptionId,
                quota: quotaId,
            }
        }
        const res = await getQuotaByPeriods.endpoint(req);
        expect(res.status).toEqual(200);
        expect(res.data['2020-10-09 00:00:00'].length).toEqual(1);
        expect(res.data['2020-10-09 00:00:00'][0].subscriptionid).toEqual(subscriptionId);
        expect(res.data['2020-10-09 00:00:00'][0].quotaid).toEqual(quotaId);
        expect(res.data['2020-10-09 00:00:00'][0].total).toEqual(1);
        expect(res.data['2021-02-09 00:00:00'].length).toEqual(1);
        expect(res.data['2021-02-09 00:00:00'][0].subscriptionid).toEqual(subscriptionId);
        expect(res.data['2021-02-09 00:00:00'][0].quotaid).toEqual(quotaId);
        expect(res.data['2021-02-09 00:00:00'][0].total).toEqual(4);
    });
});

async function initializeDB() {
    console.log("=====Start Initializeing=====");
    const insertQuotasDataQuery = `INSERT INTO default.quotas_data (requestid,subscriptionid,quotaid,calltime,increment,version,userid,apiid,limit,period)
    VALUES (1, 'subscription1', 'quotaid1', '2020-10-10 10:00:00', 5, '1.0.0', 'user1', 'apiid1', 7000, 'month'),
    (2, 'subscription3', 'quotaid2', '2020-10-10 11:00:00', 2, '1.0.0', 'user3', 'apiid2', 7000, 'month'),
    (3, 'subscription4', 'quotaid3', '2020-10-10 10:00:25', 2, '1.0.0', 'user4', 'apiid2', 7000, 'month'),
    (4, 'subscription1', 'quotaid1', '2020-10-10 14:00:25', 2, '1.0.0', 'user1', 'apiid2', 7000, 'month'),
    (5, 'subscription1', 'quotaid4', '2020-10-10 13:00:40', 1, '1.0.0', 'user6', 'apiid2', 7000, 'month'),
    (6, 'subscription2', 'quotaid1', '2020-10-10 12:00:00', 1, '1.0.0', 'user2', 'apiid1', 7000, 'month'),
    (7, 'subscription5', 'quotaid5', '2020-10-10 12:00:00', 1, '1.0.0', 'user5', 'apiid1', 7000, 'month'),
    (8, 'subscription5', 'quotaid5', '2021-02-10 12:00:00', 1, '1.0.0', 'user5', 'apiid1', 7000, 'month'),
    (9, 'subscription5', 'quotaid5', '2021-03-01 12:00:00', 3, '1.0.0', 'user5', 'apiid1', 7000, 'month')`;

    try {
        await Clickhouse.query(insertQuotasDataQuery);
        const res = await Clickhouse.query('SELECT * FROM default.quotas_data');
        return res;
    } catch (err) {
        console.log('error', err);
    }
}

async function dropDb() {
    console.log("=====Start Truncate=====");
    const tableNames = ['quotas_data', 'quotas_data_minute'];
    let resultsArr;
    if (process.env.NODE_ENV === "test") {
        resultsArr = tableNames.map(currName => Clickhouse.query(`TRUNCATE TABLE IF EXISTS default.${currName}`));
    }
    try {
        if (resultsArr) {
            const results = await Promise.all(resultsArr);
        }
    } catch (err) {
        console.log('err', err);
    }
}

async function getAllQuotas() {
    return await Clickhouse.query('SELECT * FROM default.quotas_data');
}

async function getAggregatedQuotas() {

}

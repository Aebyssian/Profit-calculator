const express = require('express');
const AmazonOrderReportsApi = require('amazon-order-reports-api');
const axios = require('axios');

const app = express();
const port = 3000;

// Amazon API credentials
const amazonConfig = {
    username: 'jake.b.wilson.1337@gmail.com',
    password: '1AsTronoMic($)',
    //otpSecret: 'USJF YSN7 87YR F8HU',
};

// eBay API credentials
const ebayConfig = {
    token: 'YOUR_EBAY_API_TOKEN',
};

async function getAmazonData(startDate, endDate) {
    const api = new AmazonOrderReportsApi(amazonConfig);

    const orders = [];
    for await (const item of api.getOrders({ startDate, endDate })) {
        orders.push(item);
    }

    const refunds = [];
    for await (const refund of api.getRefunds({ startDate, endDate })) {
        refunds.push(refund);
    }

    await api.stop();

    return { orders, refunds };
}

async function getEbayData(startDate, endDate) {
    const url = 'https://api.ebay.com/sell/finances/v1/transaction';
    const headers = {
        Authorization: `Bearer ${ebayConfig.token}`,
        'Content-Type': 'application/json',
    };

    const ordersResponse = await axios.get(url, {
        headers,
        params: {
            filter: `transactionDate:[${startDate.toISOString()}..${endDate.toISOString()}]`,
            transactionType: 'SALE',
        },
    });

    const refundsResponse = await axios.get(url, {
        headers,
        params: {
            filter: `transactionDate:[${startDate.toISOString()}..${endDate.toISOString()}]`,
            transactionType: 'REFUND',
        },
    });

    return {
        orders: ordersResponse.data.transactions,
        refunds: refundsResponse.data.transactions,
    };
}

app.get('/calculate-profit', async (req, res) => {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    try {
        const amazonData = await getAmazonData(startDate, endDate);
        const ebayData = await getEbayData(startDate, endDate);

        const amazonCost = amazonData.orders.reduce((sum, order) => sum + order.totalPrice.amount, 0);
        const amazonRefunds = amazonData.refunds.reduce((sum, refund) => sum + refund.totalRefundAmount.amount, 0);

        const ebayRevenue = ebayData.orders.reduce((sum, order) => sum + order.transactionAmount.amount, 0);
        const ebayRefunds = ebayData.refunds.reduce((sum, refund) => sum + refund.transactionAmount.amount, 0);

        const profit = ebayRevenue - amazonCost - amazonRefunds - ebayRefunds;

        res.json({
            amazonCost,
            amazonRefunds,
            ebayRevenue,
            ebayRefunds,
            profit,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

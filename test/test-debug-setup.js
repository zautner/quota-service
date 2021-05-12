jest.setTimeout(100 * 60 * 1000); // 10 minutes.
if (process.env.NODE_ENV !== "test") throw new Error("NODE_ENV not equal to 'test'");
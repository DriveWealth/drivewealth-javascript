const Funding = require("../lib/drivewealth").Funding;

let user;

beforeAll(async () => {
	user = await require("./setup").default;
});

test("return an array of subscription options", async () => {
	const pricing = await Funding.getSubscriptionPlans(user.userID);

	expect(pricing).toBeDefined();
	expect(pricing[0]).toHaveProperty("amount");
});
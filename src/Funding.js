import request from "./request";
import Sessions from "./Sessions";
import { Config, HOSTS } from "./Config";

/**
 * @class Funding
 * @description Static class for retrieving funding information.
 */
export default class Funding {
	/**
	 * @name ALLOWED_TYPES
	 * @memberof Funding
	 * @constant
	 * @property {string} DEPOSIT
	 * @property {string} WITHDRAW
	 * @property {string} DEPOSIT_AND_WITHDRAW
	 */
	static ALLOWED_TYPES = {
		DEPOSIT: "DEPOSIT",
		WITHDRAW: "WITHDRAW",
		DEPOSIT_AND_WITHDRAW: "DEPOSIT_AND_WITHDRAW",
	};

	/**
	 * @name DEPOSIT_FREQUENCIES
	 * @memberof Funding
	 * @constant
	 * @property {string} BIWEEKLY
	 * @property {string} MONTHLY_FIRST
	 * @property {string} MONTHLY_MIDDLE
	 * @property {string} QUARTERLY
	 */
	static DEPOSIT_FREQUENCIES = {
		BIWEEKLY: "BIWEEKLY",
		MONTHLY_FIRST: "MONTHLY_FIRST",
		MONTHLY_MIDDLE: "MONTHLY_MIDDLE",
		QUARTERLY: "QUARTERLY",
	};

	/**
	 * @param {object} options
	 */
	static getFundingMethods({
		userID,
		accountID,
		language,
		minAmount,
		maxAmount,
		amount,
		filters = {},
	}: {
		userID: string,
		accountID: string,
		language?: string,
		minAmount?: number,
		maxAmount?: number,
		amount?: number,
		filters?: {
			name: string,
			currency: string,
			country: string,
			allowed: string,
		},
	} = {}): Promise<Array<Object>> {
		if (amount && (minAmount || maxAmount)) {
			throw new Error(`"amount" is not compatible with "minAmount" or "maxAmount."`);
		}

		let queryString = `partner=${Config.appsPartnerID}&userID=${userID}&accountID=${accountID}`;
		if (language) queryString += `&language=${language}`;
		if (minAmount) queryString += `&minAmount=${minAmount}`;
		if (maxAmount) queryString += `&maxAmount=${maxAmount}`;
		if (amount) queryString += `&amount=${amount}`;
		if (filters.name) queryString += `&filter[name]=${filters.name}`;
		if (filters.country) queryString += `&filter[country]=${filters.country}`;
		if (filters.currency) queryString += `&filter[currency]=${filters.currency}`;
		if (filters.allowed) queryString += `&filter[allowed]=${filters.allowed}`;

		return request({
			method: "GET",
			host: HOSTS.APPS,
			endpoint: `/funding/methods?${queryString}`,
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => body);
	}

	/**
	 * @static
	 */
	static getPastDeposits(userID: string) {
		return request({
			endpoint: "/funding/status",
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => body.data);
	}

	/**
	 * @static
	 */
	static getSubscriptionPlans(userID: string) {
		return request({
			endpoint: "/subscriptions/plans",
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => {
			const pricing = [].concat(body)
				.sort((x, y) => x.amount - y.amount);

			return pricing;
		});
	}

	/**
	 * @static
	 */
	static getRecurringDeposit(id: string) {
		return request({
			endpoint: `/funding/ach/recurring-deposits/${id}`,
			sessionKey: Sessions.getAny(),
		}).then(({ body }) => body);
	}

	/**
	 * @static
	 */
	static getRecurringDepositsForUser(userID: string) {
		return request({
			endpoint: `/users/${userID}/recurring-deposits`,
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => body);
	}

	/**
	 * @static
	 */
	static getRecurringDepositsForAccount(userID: string, accountID: string) {
		return request({
			endpoint: `/users/${userID}/accounts/${accountID}/recurring-deposits`,
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => body);
	}

	/**
	 * @static
	 */
	static updateRecurringDeposit(depositID: string, data: Object): Promise<Object> {
		return request({
			method: "PATCH",
			endpoint: `/funding/ach/recurring-deposits/${depositID}`,
			sessionKey: Sessions.getAny(),
			body: data,
		}).then(({ body }) => body);
	}

	/**
	 * @static
	 */
	static deleteRecurringDeposit(depositID: string): Promise<void> {
		return request({
			method: "DELETE",
			endpoint: `/funding/ach/recurring-deposits/${depositID}`,
			sessionKey: Sessions.getAny(),
		}).then(() => undefined);
	}
}

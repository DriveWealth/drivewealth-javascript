import request from "./request";
import Sessions from "./Sessions";
import Order from "./Order";
import Funding from "./Funding";
import Reports from "./Reports";

export default class Account {

	constructor(data) {
		for (let key of [
			"accountID",
			"userID",
			"accountNo",
			"accountType",
			"currencyID",
			"ibID",
			"margin",
			"nickname",
			"openedWhen",
			"patternDayTrades",
			"status",
			"tradingType",
			"accountMgmtType",
			"commissionSchedule",
		]) {
			this[key] = data[key];
		}
	}

	getBlotter(type, cb) {
		if (type && !cb) {
			cb = type;
			type = null;
		}

		request({
			method: "GET",
			endpoint: `/users/${this.userID}/accountSummary/${this.accountID}${type ? '/' + type : ""}`,
			sessionKey: Sessions.get(this.userID)
		}, (data) => {

			if (data.orders) {
				data.orders = data.orders.map(function (order) {
					return new Order(order);
				});
			}

			cb && cb(null, type ? data[type] : data);
		}, err => cb && cb(err));
	}

	// getPerformance(startDate, endDate, cb)
	// getPerformance(period, cb)
	// getPerformance(cb)
	getPerformance() {
		let queryString = "";
		let cb;
		if (arguments.length === 3) {
			cb = arguments[2];
			const [ startDate, endDate ] = arguments;
			queryString += "/dateRange?";
			queryString += `startDate=${startDate.getFullYear()}${("0" + (startDate.getMonth() + 1)).slice(-2)}${("0" + startDate.getDate()).slice(-2)}`;
			queryString +=  `&endDate=${endDate.getFullYear()}${("0" + (endDate.getMonth() + 1)).slice(-2)}${("0" + endDate.getDate()).slice(-2)}`;
		} else if (arguments.length === 2) {
			cb = arguments[1];
			queryString += `/history?period=${arguments[0]}`;
		} else {
			cb = arguments[0];
		}

		request({
			method: "GET",
			endpoint: `/users/${this.userID}/accountPerformance/${this.accountID}${queryString}`,
			sessionKey: Sessions.get(this.userID)
		}, (data) => {
			cb && cb(null, data.performance);
		}, err => cb && cb(err));
	}

	placeOrder(type, data, cb) {
		const parentDetails = {
			accountID: this.accountID,
			accountNo: this.accountNo,
			accountType: this.accountType,
			userID: this.userID,
		};

		return Order.create(type, parentDetails, data, cb);
	}

	getFundingMethods(data = {}, cb) {
		data.userID = this.userID;
		data.accountID = this.accountID;
		return Funding.getFundingMethods(data, cb);
	}

	getTransactions(startDate, endDate, cb) {
		return Reports.getTransactions(this.userID, this.accountNo, startDate, endDate, cb);
	}

	getPlacedOrders(startDate, endDate, cb) {
		return Reports.getPlacedOrders(this.userID, this.accountNo, startDate, endDate, cb);
	}

	getStatements(startDate, endDate, cb) {
		return Reports.getStatements(this.userID, this.accountID, startDate, endDate, cb);
	}

	getTaxDocuments(startDate, endDate, cb) {
		return Reports.getTaxDocuments(this.userID, this.accountID, startDate, endDate, cb);
	}

	getTradeConfirms(startDate, endDate, cb) {
		return Reports.getTradeConfirms(this.userID, this.accountID, startDate, endDate, cb);
	}

	generateDownloadURL(fileKey, cb) {
		return Reports.generateDownloadURL(this.userID, this.accountID, fileKey, cb);
	}

	static get BLOTTER_TYPES() { return {
		CASH: "cash",
		ORDERS: "orders",
		TRANSACTIONS: "transactions",
		POSITIONS: "positions",
		ALL: null,
	} };

	static get STATUSES() { return {
		PENDING: 1,
		OPEN: 2,
		OPEN_NO_NEW_TRADES: 3,
		CLOSED: 9,
	} };

	static get TYPES() { return {
		PRACTICE: 1,
		LIVE: 2,
	} };

	static getListForUserID(userID, cb) {
		request({
			method: "GET",
			endpoint: `/users/${userID}/accounts`,
			sessionKey: Sessions.get(userID)
		}, (data) => {
			cb && cb(null, data.map(account => new Account(account)));
		}, err => cb && cb(err));
	}

	static create(userID, type, data, cb) {
		if (type === Account.TYPES.PRACTICE) {
			data = {
				userID,
				responseType: "full",
				tranAmount: data,
			};
		}

		request({
			method: "POST",
			endpoint: type === Account.TYPES.PRACTICE
				? `/signups/practice`
				: `/signups/live`,
			sessionKey: Sessions.get(userID),
			body: data,
		}, (data) => {
			cb && cb(null, data);
		}, err => cb && cb(err));
	}

	static changeSubscription (method, {
		userID,
		accountID,
		planID,
		paymentID,
	}, cb) {

		const params = {
			method,
			endpoint: `/users/${userID}/accounts/${accountID}/subscriptions`,
			sessionKey: Sessions.get(userID),
			body: method !== "DELETE" && {
				planID,
				[paymentID.startsWith("card") ? "cardID" : "bankAccountID"]: paymentID,
			},
		};

		request(
			Object.keys(params)
			.filter(key => params[key])
			.reduce((x, y) => Object.assign({}, x, { [y]: params[y] }), {}),
			data => {
				cb && cb(null, data);
			},
			err => {
				cb && cb(err);
			},
		);
	}

	static addSubscription (options, cb) {
		Account.changeSubscription("POST", options, cb);
	}

	static updateSubscription (options, cb) {
		Account.changeSubscription("PUT", options, cb);
	}

	static cancelSubscription (options, cb) {
		Account.changeSubscription("DELETE", options, cb);
	}

	extractIDs (options) {
		return Object.assign({}, options, {
			userID: this.userID,
			accountID: this.accountID,
		});
	}

	addSubscription (options, cb) {
		Account.addSubscription(this.extractIDs(options), cb);
	}

	updateSubscription (options, cb) {
		Account.updateSubscription(this.extractIDs(options), cb);
	}

	cancelSubscription (cb) {
		Account.cancelSubscription(this.extractIDs(), cb);
	}

}

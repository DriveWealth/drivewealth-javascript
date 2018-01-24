/* @flow */
import request from "./request";
import { Config } from "./Config";
import Sessions from "./Sessions";
import Account from "./Account";

/**
 * @class User
 * @description A user object. Use the constructor if you have a flat JSON object that you would like to access instance methods on.
 * @param {object} data - See response at {@link http://developer.drivewealth.com/docs/get-user}
 */
class User {
	countryID: string;
	emailAddress: string;
	firstName: string;
	languageID: string;
	lastName: string;
	phoneNumber: string;
	referralCode: string;
	userID: string;
	username: string;
	wlpID: string;
	status: string;
	usCitizen: boolean;
	lastLoginWhen: string;
	citizenship: string;
	addressLine1: string;
	addressLine2: string;
	city: string;
	stateProvince: string;
	zipPostalCode: string;
	fullName: string;

	constructor(data: Object) {
		Object.assign(this, data);
		this.fullName = data.firstName + " " + data.lastName;
	}

	/**
	 * @name STATUSES
	 * @property {Number} PENDING
	 * @property {Number} APPROVED
	 * @property {Number} REJECTED
	 * @property {Number} REVOKED
	 * @property {Number} CLOSED
	 * @memberof User
	 * @constant
	 */
	static STATUSES: {[status: string]: number} = {
		PENDING: 1,
		APPROVED: 2,
		REJECTED: 3,
		REVOKED: 4,
		CLOSED: 5,
	};

	/**
	 * @name DOCUMENT_TYPES
	 * @property {string} PHOTO_ID
	 * @property {string} PROOF_OF_ADDRESS
	 * @property {string} PHOTO_ID_WITH_PROOF_OF_ADDRESS
	 * @memberof User
	 * @constant
	 */
	static DOCUMENT_TYPES: {[type: string]: string} = {
		PHOTO_ID: "Picture ID",
		PROOF_OF_ADDRESS: "Proof of address",
		PHOTO_ID_WITH_PROOF_OF_ADDRESS: "Picture ID_Proof of address",
	};

	/**
	 * @static
	 */
	static getAccounts(userID: string): Promise<Array<Account>> {
		return Account.getListForUserID(userID);
	}

	/**
	 * @instance
	 */
	getAccounts(): Promise<Array<Account>> {
		return Account.getListForUserID(this.userID);
	}

	/**
	 * Get all settings
	 * @param  {string} userID
	 * @return {Promise<Object.<string, string>>}
	 */
	/**
	 * Get setting value by key
	 * @param  {string} userID
	 * @param  {string} key
	 * @return {Promise<string>}
	 */
	static getSettings(userID: string, key?: string) {
		if (!key) {
			return request({
				method: "GET",
				endpoint: `/users/${userID}/settings`,
				sessionKey: Sessions.get(userID),
			}).then(({ body }) => {
				const formattedData = {};
				for (const setting of body) {
					formattedData[setting.key] = setting.value;
				}
				return formattedData;
			});
		}

		return request({
			method: "GET",
			endpoint: `/users/${userID}/settings/${key}`,
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => body.value);
	}

	/**
	 * Get all settings
	 * @return {Promise<Object.<string, string>>}
	 */
	/**
	 * Get setting value
	 * @param  {string} key
	 * @return {Promise<string>}
	 */
	getSettings(key?: string) {
		return User.getSettings(this.userID, key);
	}

	/**
	 * @static
	 */
	static setSetting(userID: string, key: string, value: string): Promise<void> {
		return request({
			method: "POST",
			endpoint: `/users/${userID}/settings`,
			sessionKey: Sessions.get(userID),
			body: {
				key, value,
			},
		}).then(() => undefined);
	}

	/**
	 * @instance
	 */
	setSetting(key: string, value: string): Promise<void> {
		return User.setSetting(this.userID, key, value);
	}

	static unsetSetting(userID: string, key: string) : Promise<void> {
		return request({
			method: "DELETE",
			endpoint: `/users/${userID}/settings/${key}`,
			sessionKey: Sessions.get(userID),
		}).then(() => undefined);
	}

	/**
	 * @instance
	 */
	unsetSetting(key: string): Promise<void> {
		return User.unsetSetting(this.userID, key);
	}

	/**
	 * @description See response at {@link http://developer.drivewealth.com/docs/user-status}
	 */
	getStatus(): Promise<Object> {
		return request({
			method: "GET",
			endpoint: `/users/${this.userID}/status`,
			sessionKey: Sessions.get(this.userID),
		}).then(({ body }) => body);
	}

	/**
	 *  @static
	 */
	static logout(userID: string): Promise<void> {
		return request({
			method: "DELETE",
			endpoint: `/userSessions/${Sessions.get(userID)}`,
			sessionKey: Sessions.get(userID),
		}).then(() => {
			Sessions.remove(userID);
		});
	}

	/**
	 * @instance
	 */
	logout(): Promise<void> {
		return User.logout(this.userID);
	}

	/**
	 * @static
	 */
	static getByUserID(userID: string): Promise<User> {
		return request({
			method: "GET",
			endpoint: `/users/${userID}`,
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => new User(body));
	}

	/**
	 * @instance
	 */
	get(): Promise<User> {
		return User.getByUserID(this.userID);
	}

	/**
	 * @static
	 */
	static login(username: string, password: string): Promise<User> {
		return request({
			method: "POST",
			endpoint: "/userSessions",
			body: {
				username,
				password,
				appTypeID: Config.appTypeID,
				appVersion: Config.appVersion,
				languageID: "en_US",
				osType: "unknown",
				osVersion: "unknown",
				scrRes: "unknown",
				ipAddress: "unknown",
			},
		}).then(({ body }) => {
			Sessions.save(body.userID, body.sessionKey);
			return User.getByUserID(body.userID);
		});
	}

	/**
	 * @static
	 */
	static isUsernameAvailable(username: string): Promise<boolean> {
		return request({
			method: "GET",
			endpoint: `/users?username=${username}`,
		}).then(
			() => false,
			(rejection) => rejection.statusCode === 404
				? true
				: Promise.reject(rejection),
		);
	}

	/**
	 * @param {object} data
	 * @param {boolean} loginAutomatically - If false, no session will be created.
	 * @return {Promise<undefined | User>} If loginAutomatically is true, a User will be resolved.
	 */
	static create({
		username,
		password,
		firstName,
		lastName,
		email,
		languageID,
		referralCode = Config.referralCode,
		utmCampaign,
		utmContent,
		utmMedium,
		utmSource,
		utmTerm,
	}, loginAutomatically: boolean = true): Promise<void | User> {
		return request({
			method: "POST",
			endpoint: "/signups/live",
			body: {
				username,
				password,
				firstName,
				lastName,
				emailAddress1: email,
				languageID,
				wlpID: Config.wlpID,
				referralCode,
				utmCampaign,
				utmContent,
				utmMedium,
				utmSource,
				utmTerm,
			},
		}).then(() => {
			if (loginAutomatically) {
				return User.login(username, password);
			}
		});
	}

	/**
	 * @param {object} data
	 */
	static update({
		userID,
		addressLine1,
		addressLine2,
		city,
		countryID,
		email,
		firstName,
		lastName,
		languageID,
		phoneHome,
		phoneWork,
		phone,
		stateProvince,
		zipPostalCode,
	}): Promise<void> {
		return request({
			method: "PUT",
			endpoint: `/users/${userID}`,
			sessionKey: Sessions.get(userID),
			body: {
				addressLine1,
				addressLine2,
				city,
				countryID,
				emailAddress1: email,
				firstName,
				lastName,
				languageID,
				phoneHome,
				phoneWork,
				phoneMobile: phone,
				stateProvince,
				zipPostalCode,
			},
		}).then(() => undefined);
	}

	/**
	 * @instance
	 */
	update(data: Object): Promise<void> {
		return User.update(Object.assign({}, data, {
			userID: this.userID,
			email: data.email || this.emailAddress,
		}));
	}

	/**
	 * @static
	 */
	static uploadDocument(userID: string, file: File, type: string): Promise<void> {
		// The following line is for eslint
		/* global FormData */
		const body = new FormData();
		body.append("token", userID);
		body.append("documentType", type);
		body.append("documentImage", file);

		return request({
			method: "POST",
			endpoint: "/documents",
			sessionKey: Sessions.get(userID),
			addlHeaders: {
				"Content-Type": "multipart/form-data",
			},
			body,
		}).then(() => undefined);
	}

	/**
	 * @instance
	 */
	uploadDocument(file: File, type: string): Promise<void> {
		return User.uploadDocument(this.userID, file, type);
	}

	/**
	 * @instance
	 */
	getCreditCards(): Promise<Array<Object>> {
		return User.getCreditCards(this.userID);
	}

	/**
	 * @static
	 */
	static getCreditCards(userID: string): Promise<Array<Object>> {
		return request({
			method: "GET",
			endpoint: `/users/${userID}/credit-cards`,
			sessionKey: Sessions.get(userID),
		}).then(({ body }) => body);
	}

	/**
	 * @instance
	 */
	addCreditCard(cardToken: string): Promise<Object> {
		return User.addCreditCard(this.userID, cardToken);
	}

	/**
	 * @static
	 */
	static addCreditCard(userID: string, cardToken: string): Promise<Object> {
		return request({
			method: "POST",
			endpoint: `/users/${userID}/credit-cards`,
			sessionKey: Sessions.get(userID),
			body: { cardToken },
		}).then(({ body }) => body);
	}

	/**
	 * @instance
	 */
	removeCreditCard(cardID: string): Promise<void> {
		return User.removeCreditCard(this.userID, cardID);
	}

	/**
	 * @static
	 */
	static removeCreditCard(userID: string, cardID: string): Promise<void> {
		return request({
			method: "DELETE",
			endpoint: `/users/${userID}/credit-cards/${cardID}`,
			sessionKey: Sessions.get(userID),
		}).then(() => undefined);
	}

	/**
	 * @static
	 */
	static forgotPassword(username: string): Promise<string> {
		return request({
			method: "POST",
			endpoint: "/users/passwords",
		}).then(body => body.passwordResetID);
	}

	/**
	 * @static
	 */
	static resetPassword(passwordResetID: string, code: string, password: string): Promise<void> {
		return request({
			method: "PUT",
			endpoint: `/users/passwords/${passwordResetID}`,
			body: {
				code,
				passwordResetID,
				password,
			},
		});
	}
}

export default User;

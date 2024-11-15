import { COOKIE_NAME } from './consts';
import { sealData, unsealData } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET cannot be empty.');
}

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID cannot be empty.');
}

const SESSION_OPTIONS = {
    ttl: 60 * 60 * 24 * 3,
    password: process.env.SESSION_SECRET,
};

export class Session {
    /**
     * Constructor for initializing a session object.
     * 
     * @param {Object} session - The session object containing initialization data.
     * @param {string} session.nonce - A unique identifier for the session.
     * @param {number} session.chainId - The blockchain network identifier.
     * @param {string} session.address - The address associated with the session.
     */
    constructor(session) {
        this.nonce = session?.nonce;
        this.chainId = session?.chainId;
        this.address = session?.address;
    }

    /**
     * Creates a Session instance from a request.
     *
     * @param {Object} req - The request object.
     * @param {Object} req.cookies - The cookies object from the request.
     * @returns {Promise<Session>} A promise that resolves to a Session instance.
     */
    static async fromRequest(req) {
        const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;

        if (!sessionCookie) return new Session();
        return new Session(await unsealData(sessionCookie, SESSION_OPTIONS));
    }

    /**
     * Clears the current state by setting nonce, chainId, and address to undefined.
     * Then persists the result.
     *
     * @param {Object} res - The result object to be persisted.
     * @returns {Object} - The persisted result.
     */
    clear(res) {
        this.nonce = undefined;
        this.chainId = undefined;
        this.address = undefined;

        return this.persist(res);
    }

    /**
     * Converts the current object to a JSON representation.
     * 
     * @returns {Object} A JSON object containing the nonce, address, and chainId properties.
     */
    toJSON() {
        return { nonce: this.nonce, address: this.address, chainId: this.chainId };
    }

    /**
     * Asynchronously persists session data by setting a cookie with sealed data.
     *
     * @param {Object} res - The response object.
     * @param {Object} res.cookies - The cookies object from the response.
     * @param {Function} res.cookies.set - Function to set a cookie.
     * @returns {Promise<void>} - A promise that resolves when the cookie is set.
     */
    async persist(res) {
        res.cookies.set(COOKIE_NAME, await sealData(this.toJSON(), SESSION_OPTIONS), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',
        });
    }
}

export default Session;

import { ethers } from 'ethers';
import abi from './abi/abi.json'; // Ensure correct path to your ABI file

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_DSRC_FACTORY_SKL;
const MAX_URI_LENGTH = 1000;
const BASIS_POINTS = 10000;
const MAX_RECIPIENTS = 10;
const MIN_DEADLINE = 5 * 60;
const MAX_DEADLINE = 60 * 60;
const MAX_UINT216 = BigInt(2n ** 216n - 1n);

const Edition = {
    Streaming: 0,
    Collectors: 1,
    Licensing: 2
};

const convertBigIntToString = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(item => convertBigIntToString(item));
    if (typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = convertBigIntToString(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};

export async function getDSRCAddressServer(dsrcId) {
    if (!dsrcId) {
        throw new Error('DSRC ID is required');
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const dsrcIdHash = ethers.keccak256(ethers.toUtf8Bytes(dsrcId));

        const address = await contract.dsrcs(dsrcIdHash);

        if (address === ethers.ZeroAddress) {
            throw new Error('DSRC not found');
        }

        const isValid = await contract.isValidDSRC(address);
        if (!isValid) {
            throw new Error('Invalid DSRC address');
        }

        return address;
    } catch (error) {
        console.error("Error fetching DSRC address:", error);
        throw error;
    }
}

export async function getDSRCByChainServer(chain, dsrcId) {
    if (!chain || !dsrcId) {
        throw new Error('Chain and DSRC ID are required');
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const chainHash = ethers.keccak256(ethers.toUtf8Bytes(chain));
        const dsrcIdHash = ethers.keccak256(ethers.toUtf8Bytes(dsrcId));

        const address = await contract.chainDsrcs(chainHash, dsrcIdHash);

        if (address === ethers.ZeroAddress) {
            throw new Error('DSRC not found for the specified chain');
        }

        const isValid = await contract.isValidDSRC(address);
        if (!isValid) {
            throw new Error('Invalid DSRC address');
        }

        return address;
    } catch (error) {
        console.error("Error fetching DSRC by chain:", error);
        throw error;
    }
}

export async function getYearCountServer(address, year) {
    if (!address || year === undefined || year === null) {
        throw new Error('Address and year are required');
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const count = await contract.yearCounts(address, BigInt(year));
        return Number(count);
    } catch (error) {
        console.error("Error fetching year count:", error);
        throw error;
    }
}

export async function getDSRCNonceServer(address) {
    if (!address) {
        throw new Error('Address is required');
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const nonce = await contract.nonces(address);
        return Number(nonce);
    } catch (error) {
        console.error("Error fetching DSRC nonce:", error);
        throw error;
    }
}

export async function isValidDSRCServer(address) {
    if (!address) {
        throw new Error('Address is required');
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        return await contract.isValidDSRC(address);
    } catch (error) {
        console.error("Error checking DSRC validity:", error);
        throw error;
    }
}

export async function validateDSRCParamsServer(params) {
    try {
        if (!params.tokenURI || params.tokenURI.length === 0) {
            throw new Error('Token URI cannot be empty');
        }

        if (params.tokenURI.length > MAX_URI_LENGTH) {
            throw new Error(`Token URI too long (max ${MAX_URI_LENGTH} characters)`);
        }

        if (!params.recipients || !Array.isArray(params.recipients) || params.recipients.length === 0) {
            throw new Error('Recipients must be a non-empty array');
        }

        if (params.recipients.length > MAX_RECIPIENTS) {
            throw new Error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
        }

        if (!params.percentages || params.recipients.length !== params.percentages.length) {
            throw new Error('Recipients and percentages must have matching lengths');
        }

        for (const recipient of params.recipients) {
            if (!recipient || recipient === ethers.ZeroAddress) {
                throw new Error('Zero address not allowed in recipients');
            }
            try {
                ethers.getAddress(recipient);
            } catch {
                throw new Error(`Invalid address format: ${recipient}`);
            }
        }

        const totalPercentage = params.percentages.reduce((sum, p) => sum + Number(p), 0);
        if (totalPercentage !== BASIS_POINTS) {
            throw new Error(`Total percentage must be ${BASIS_POINTS} (100%), got: ${totalPercentage}`);
        }

        for (const percentage of params.percentages) {
            if (percentage > BASIS_POINTS) { // Updated Validation to BASIS_POINTS
                throw new Error(`Percentage value exceeds maximum allowed (${BASIS_POINTS} or 100%): ${percentage}`);
            }
        }

        const collectorsPrice = BigInt(params.collectorsPrice || 0);
        const licensingPrice = BigInt(params.licensingPrice || 0);

        if (collectorsPrice === 0n && licensingPrice === 0n) {
            throw new Error('Either collectors price or licensing price must be non-zero');
        }

        if (collectorsPrice > MAX_UINT216 || licensingPrice > MAX_UINT216) {
            throw new Error(`Price exceeds maximum allowed value (${MAX_UINT216.toString()} wei)`); // Updated Error Message
        }

        if (params.deadline) {
            const now = Math.floor(Date.now() / 1000);
            if (params.deadline < now + MIN_DEADLINE || params.deadline > now + MAX_DEADLINE) {
                throw new Error(`Deadline must be between ${MIN_DEADLINE/60} minutes and ${MAX_DEADLINE/60} hour from now`);
            }
        }

        return true;
    } catch (error) {
        console.error("DSRC parameter validation error:", error);
        throw error;
    }
}

export { Edition, convertBigIntToString };
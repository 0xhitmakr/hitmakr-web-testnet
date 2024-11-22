import { ethers } from 'ethers';
import abi from './abi/abi.json';

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_DSRC_FACTORY_SKL;

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
        
        const address = await contract.getDSRCByChain(chain, dsrcId);
        
        if (address === ethers.ZeroAddress) {
            throw new Error('DSRC not found for the specified chain');
        }

        return address;
    } catch (error) {
        console.error("Error fetching DSRC by chain:", error);
        throw error;
    }
}

export async function getCurrentYearCountServer(address) {
    if (!address) {
        throw new Error('Address is required');
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        
        const [year, count] = await contract.getCurrentYearCount(address);
        
        return {
            year: Number(year),
            count: Number(count)
        };
    } catch (error) {
        console.error("Error fetching current year count:", error);
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
        
        const count = await contract.getYearCount(address, year);
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
        
        const nonce = await contract.getNonce(address);
        return Number(nonce);
    } catch (error) {
        console.error("Error fetching DSRC nonce:", error);
        throw error;
    }
}
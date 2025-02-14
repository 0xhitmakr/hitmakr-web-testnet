import { ethers } from 'ethers';
import abi from './abi/abi.json';

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;

// Edition enum to match contract
const Edition = {
  Streaming: 0,
  Collectors: 1,
  Licensing: 2
};

export async function getDSRCDetailsServer(contractAddress) {
    if (!contractAddress || contractAddress === ethers.ZeroAddress) {
        return null;
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const [
            dsrcId,
            tokenUri,
            creator,
            paymentToken,
            selectedChain,
            earningsInfo,
            streamingConfig,
            collectorsConfig,
            licensingConfig,
            totalSupply
        ] = await Promise.all([
            contract.dsrcId(),
            contract.tokenURI(1),
            contract.creator(),
            contract.paymentToken(),
            contract.selectedChain(),
            contract.getEarningsInfo(),
            contract.getEditionConfig(Edition.Streaming),
            contract.getEditionConfig(Edition.Collectors),
            contract.getEditionConfig(Edition.Licensing),
            contract.totalSupply_()
        ]);

        const editions = {
            streaming: {
                price: streamingConfig[0].toString(),
                isEnabled: streamingConfig[1],
                isCreated: streamingConfig[2]
            },
            collectors: {
                price: collectorsConfig[0].toString(),
                isEnabled: collectorsConfig[1],
                isCreated: collectorsConfig[2]
            },
            licensing: {
                price: licensingConfig[0].toString(),
                isEnabled: licensingConfig[1],
                isCreated: licensingConfig[2]
            }
        };

        const details = {
            dsrcId,
            tokenUri,
            creator,
            paymentToken,
            selectedChain,
            editions,
            totalSupply: totalSupply.toString(),
            earnings: {
                purchaseEarnings: earningsInfo[0].toString(),
                royaltyEarnings: earningsInfo[1].toString(),
                pendingAmount: earningsInfo[2].toString(),
                totalEarnings: earningsInfo[3].toString()
            }
        };

        // If tokenUri is a valid URL, fetch metadata
        let metadata = null;
        if (tokenUri && tokenUri.startsWith('http')) {
            try {
                const metadataResponse = await fetch(tokenUri);
                metadata = await metadataResponse.json();
            } catch (error) {
                console.error("Error fetching metadata:", error);
                // Don't throw here - we still want to return the details even if metadata fetch fails
            }
        }

        return {
            details,
            metadata
        };
    } catch (error) {
        console.error("Error fetching DSRC details:", error);
        throw error;
    }
}

// Helper function to get edition config server-side
export async function getEditionConfigServer(contractAddress, edition) {
    if (!contractAddress || contractAddress === ethers.ZeroAddress) {
        return null;
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const config = await contract.getEditionConfig(edition);
        return {
            price: config[0].toString(),
            isEnabled: config[1],
            isCreated: config[2]
        };
    } catch (error) {
        console.error("Error fetching edition config:", error);
        throw error;
    }
}

// Helper function to get token edition server-side
export async function getTokenEditionServer(contractAddress, tokenId) {
    if (!contractAddress || contractAddress === ethers.ZeroAddress || !tokenId) {
        return null;
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const edition = await contract.getTokenEdition(tokenId);
        return edition;
    } catch (error) {
        console.error("Error fetching token edition:", error);
        throw error;
    }
}

export { Edition };
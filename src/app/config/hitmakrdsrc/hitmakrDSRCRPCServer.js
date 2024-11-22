import { ethers } from 'ethers';
import abi from './abi/abi.json';

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;

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
            price,
            selectedChain,
            earningsInfo,
            royaltySplits
        ] = await Promise.all([
            contract.dsrcId(),
            contract.tokenURI(1),
            contract.creator(),
            contract.paymentToken(),
            contract.price(),
            contract.getSelectedChain(),
            contract.getEarningsInfo(),
            contract.getRoyaltySplits()
        ]);

        const details = {
            dsrcId,
            tokenUri,
            creator,
            paymentToken,
            price: price.toString(),
            selectedChain,
            earnings: {
                purchaseEarnings: earningsInfo[0].toString(),
                royaltyEarnings: earningsInfo[1].toString(),
                pendingAmount: earningsInfo[2].toString(),
                totalEarnings: earningsInfo[3].toString()
            },
            royaltySplits: royaltySplits.map(split => ({
                recipient: split.recipient,
                percentage: Number(split.percentage)
            }))
        };

        const metadataResponse = await fetch(tokenUri);
        const metadata = await metadataResponse.json();

        return {
            details,
            metadata
        };
    } catch (error) {
        console.error("Error fetching DSRC details:", error);
        throw error;
    }
}
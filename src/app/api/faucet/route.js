// app/api/faucet/route.js
import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

// Queue to store pending requests
let transactionQueue = [];
let isProcessing = false;

// Process all transactions in the queue
async function processQueue(provider, wallet) {
  if (isProcessing) return;
  
  try {
    isProcessing = true;
    
    // If queue is empty, nothing to process
    if (transactionQueue.length === 0) {
      isProcessing = false;
      return;
    }

    // Amount to send per address (0.001 ETH)
    const amountPerAddress = ethers.parseEther('0.001');
    
    // Check faucet balance
    const faucetBalance = await provider.getBalance(wallet.address);
    const totalNeeded = amountPerAddress * BigInt(transactionQueue.length);
    
    if (faucetBalance < totalNeeded) {
      throw new Error('Insufficient faucet balance for batch');
    }

    // Get current nonce
    const nonce = await provider.getTransactionCount(wallet.address);

    // Create batch of transactions
    const transactions = await Promise.all(transactionQueue.map(async (request, index) => {
      try {
        // Check if address already has balance
        const addressBalance = await provider.getBalance(request.address);
        if (addressBalance > 0n) {
          request.resolve({ 
            status: 400, 
            message: 'Address already has funds' 
          });
          return null;
        }

        // Create transaction
        return {
          to: request.address,
          value: amountPerAddress,
          nonce: nonce + index,
          gasLimit: 21000, // Standard gas limit for ETH transfers
        };
      } catch (error) {
        request.resolve({ 
          status: 500, 
          message: 'Failed to process address' 
        });
        return null;
      }
    }));

    // Filter out null transactions
    const validTransactions = transactions.filter(tx => tx !== null);

    // Send all transactions
    const txPromises = validTransactions.map(tx => wallet.sendTransaction(tx));
    const sentTxs = await Promise.all(txPromises);

    // Wait for all transactions to be mined
    const receipts = await Promise.all(sentTxs.map(tx => tx.wait()));

    // Resolve promises for successful transactions
    receipts.forEach((receipt, index) => {
      const request = transactionQueue[index];
      request.resolve({
        status: 200,
        message: 'Successfully sent test ETH',
        txHash: receipt.hash
      });
    });

  } catch (error) {
    // If batch fails, resolve all pending requests with error
    transactionQueue.forEach(request => {
      request.resolve({
        status: 500,
        message: 'Failed to process batch transaction'
      });
    });
  } finally {
    // Clear the queue and reset processing flag
    transactionQueue = [];
    isProcessing = false;
  }
}

export async function POST(request) {
  try {
    const { address } = await request.json();

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { message: 'Invalid address' },
        { status: 400 }
      );
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SKALE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.FUEL_WALLET, provider);

    // Create a promise that will be resolved when the transaction is processed
    const result = await new Promise(resolve => {
      // Add request to queue
      transactionQueue.push({ address, resolve });
      
      // Start processing queue
      processQueue(provider, wallet);
    });

    return NextResponse.json(
      { message: result.message, txHash: result.txHash },
      { status: result.status }
    );

  } catch (error) {
    console.error('Faucet error:', error);
    return NextResponse.json(
      { message: 'Failed to send test ETH' },
      { status: 500 }
    );
  }
}
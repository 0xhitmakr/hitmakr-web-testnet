import { NextResponse } from 'next/server';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const API_KEY = process.env.CAMP_API_KEY;
const BASE_URL = `${process.env.CAMP_BASE_URL}/spotify/wallet-spotify-data`;
const JWT_SECRET = process.env.JWT_SECRET;


export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchWalletAddress = searchParams.get('searchWalletAddress');

  if (!searchWalletAddress) {
    return NextResponse.json({ error: 'Search wallet address is required' }, { status: 400 });
  }

  const authHeader = request.headers.get('Authorization');
  const address = request.headers.get('X-User-Address');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !address) {
    return NextResponse.json({ error: 'Missing required headers' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.address || !decoded.chainId) {
      return NextResponse.json({ error: 'Invalid JWT token' }, { status: 403 });
    }

    if (decoded.address.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Address or chainId mismatch' }, { status: 403 });
    }

    const response = await axios.get(BASE_URL, {
      params: { walletAddress: searchWalletAddress },
      headers: { 'x-api-key': API_KEY },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'JWT token has expired' }, { status: 403 });
    }
    if (error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    console.error('Error fetching Spotify wallet data:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  }
}

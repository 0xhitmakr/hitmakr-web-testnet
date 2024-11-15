import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET;
const UPDATE_COOLDOWN = 60 * 60;
const MONGODB_URI = process.env.MONGO_DB_URI;

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb; 
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB");

    const dbName = process.env.MONGODB_DB || 'creativeData';
    const db = client.db(dbName);
    cachedDb = db;
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; 
  }
}


function verifyToken(authHeader, address, chainId) {
  if (!authHeader || !address || !chainId) {
    throw new Error('Missing required headers');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Invalid Authorization header');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.address || !decoded.chainId) {
      throw new Error('Invalid JWT token');
    }

    if (decoded.address.toLowerCase() !== address.toLowerCase() || decoded.chainId !== parseInt(chainId)) {
      throw new Error('Address or chainId mismatch');
    }

    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('JWT token has expired');
    } else {
      throw new Error('Failed to verify JWT token');
    }
  }
}



async function checkRateLimit(walletAddress) {
  const db = await connectToDatabase();
  const collection = db.collection('creativeForms');

  const data = await collection.findOne({ walletAddress });

  if (data && data.lastUpdateTime) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastUpdate = currentTime - data.lastUpdateTime;

    if (timeSinceLastUpdate < UPDATE_COOLDOWN) {
      const remainingTime = UPDATE_COOLDOWN - timeSinceLastUpdate;
      const remainingMinutes = Math.ceil(remainingTime / 60);
      return { rateLimited: true, remainingMinutes };
    }
  }
  return { rateLimited: false };
}



function validateFormData(formData, formType) {
  const requiredFields = formType === 'artist'
    ? ['fullName', 'dateOfBirth', 'physicalAddress', 'phone', 'email', 'genres', 'musicLinks']
    : ['legalName', 'registrationNumber', 'establishmentDate', 'registeredAddress', 'website', 'entityType', 'country', 'owners', 'executives', 'phone', 'email', 'contactPerson', 'signedArtists', 'socialMedia'];

  for (const field of requiredFields) {
    if (!formData[field] || formData[field].trim() === '') {
      throw new Error(`Required field '${field}' is empty`);
    }
  }
}

export async function POST(request) {
  try {
    const { walletAddress, formType, ...formData } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const address = request.headers.get('X-User-Address');
    const chainId = request.headers.get('X-Chain-Id');

    if (!authHeader || !address || !chainId) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 401 });
    }

    const decoded = verifyToken(authHeader, address, chainId);

    if (decoded.address.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized to modify this wallet data' }, { status: 403 });
    }

    try {
      validateFormData(formData, formType);
    } catch (validationError) {
      return NextResponse.json({ error: validationError.message }, { status: 400 });
    }

    const db = await connectToDatabase();
    const collection = db.collection('creativeForms');

    const existingData = await collection.findOne({ walletAddress });

    if (existingData) {
      const { rateLimited, remainingMinutes } = await checkRateLimit(walletAddress);
      if (rateLimited) {
        return NextResponse.json({ 
          error: `Rate limit exceeded. Please wait ${remainingMinutes} minutes before updating again.` 
        }, { status: 429 });
      }
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const updateData = {
      ...formData,
      formType,
      walletAddress,
      lastUpdated: new Date().toISOString(),
      lastUpdateTime: currentTime
    };

    const result = await collection.updateOne(
      { walletAddress },
      { $set: updateData },
      { upsert: true } 
    );

    if (result.acknowledged) {
      return NextResponse.json(
        {
          message: 'Creative data stored successfully',
          ...updateData
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to store creative data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error storing creative data:', error);
    return handleError(error);
  }
}



export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const address = request.headers.get('X-User-Address');
    const chainId = request.headers.get('X-Chain-Id');

    if (!authHeader || !address || !chainId) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 401 });
    }

    const decoded = verifyToken(authHeader, address, chainId); 

    const db = await connectToDatabase();
    const collection = db.collection('creativeForms');

    const data = await collection.findOne({ walletAddress: decoded.address });

    if (!data) {
      return NextResponse.json({ error: 'No data found for this wallet address' }, { status: 404 });
    }

    delete data._id;
    delete data.lastUpdateTime; 

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error retrieving creative data:', error);
    return handleError(error);
  }
}


function handleError(error) {
  console.error('Error details:', error); 

  if (error.name === 'TokenExpiredError') {
    return NextResponse.json({ error: 'JWT token has expired' }, { status: 403 });
  } else if (error.message.includes('Rate limit exceeded')) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  } else if (error.message.includes('Missing required headers') || 
             error.message.includes('Invalid Authorization header') ||
             error.message.includes('Invalid JWT token') ||
             error.message.includes('Address or chainId mismatch') || 
             error.message.includes('Failed to verify JWT token')) {
    return NextResponse.json({ error: error.message }, { status: 401 }); 
  } else {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
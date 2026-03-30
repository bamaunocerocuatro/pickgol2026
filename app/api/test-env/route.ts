 import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN ? 'OK' : 'MISSING',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'OK' : 'MISSING',
    PAYPAL_SECRET: process.env.PAYPAL_SECRET ? 'OK' : 'MISSING',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'OK' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  });
}

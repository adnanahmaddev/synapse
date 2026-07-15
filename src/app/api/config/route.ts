import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongodb';

const USER_ID = 'local-user';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('synapse');

    const settings = await db.collection('user_settings').findOne({ _id: USER_ID as any });
    const modelConfig = settings?.modelConfig || null;

    return NextResponse.json({ modelConfig });
  } catch (error: any) {
    console.error('Failed to fetch config from MongoDB:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('synapse');

    if (!body.modelConfig) {
      return NextResponse.json({ error: 'Missing modelConfig in request body' }, { status: 400 });
    }

    await db.collection('user_settings').updateOne(
      { _id: USER_ID as any },
      { $set: { modelConfig: body.modelConfig } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save config to MongoDB:', error);
    return NextResponse.json({ error: error.message || 'Failed to save config' }, { status: 500 });
  }
}

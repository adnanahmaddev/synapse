import { NextResponse } from 'next/server';
import clientPromise from '@/utils/mongodb';
import { Course } from '@/types';

const USER_ID = 'local-user';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('synapse');

    const courses = await db.collection('courses').find({}).sort({ createdAt: -1 }).toArray();

    const settings = await db.collection('user_settings').findOne({ _id: USER_ID as any });
    const activeCourseId = settings?.activeCourseId || null;

    // Remove MongoDB internal _id before returning to match expected types
    const sanitizedCourses = courses.map(({ _id, ...rest }) => rest);

    return NextResponse.json({
      history: sanitizedCourses,
      activeCourseId
    });
  } catch (error: any) {
    console.error('Failed to fetch courses from MongoDB:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('synapse');

    // 1. Bulk migration of course history
    if (body.courses && Array.isArray(body.courses)) {
      if (body.courses.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
      }

      const operations = body.courses.map((course: Course) => ({
        updateOne: {
          filter: { id: course.id },
          update: { $set: course },
          upsert: true
        }
      }));

      const result = await db.collection('courses').bulkWrite(operations);
      return NextResponse.json({ 
        success: true, 
        count: result.upsertedCount + result.modifiedCount + result.matchedCount 
      });
    }

    // 2. Setting active course ID
    if (body.activeCourseId !== undefined) {
      await db.collection('user_settings').updateOne(
        { _id: USER_ID as any },
        { $set: { activeCourseId: body.activeCourseId } },
        { upsert: true }
      );
      return NextResponse.json({ success: true });
    }

    // 3. Upserting a single course (e.g. on creation or lesson completion)
    if (body.course) {
      const course = body.course;
      await db.collection('courses').updateOne(
        { id: course.id },
        { $set: course },
        { upsert: true }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to save data to MongoDB:', error);
    return NextResponse.json({ error: error.message || 'Failed to save data' }, { status: 500 });
  }
}

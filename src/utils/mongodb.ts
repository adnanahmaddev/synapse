import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise: Promise<MongoClient>;

if (!uri) {
  // Return a rejected promise instead of throwing during module evaluation.
  // This allows the Next.js server to start and load routes cleanly, and
  // the route handlers will catch this error gracefully to run client fallbacks.
  clientPromise = Promise.reject(
    new Error('Missing environment variable: "MONGODB_URI". Configure it in your .env file.')
  );
  // Prevent UnhandledPromiseRejection warnings in Node.js
  clientPromise.catch(() => {});
} else {
  let client: MongoClient;

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the connection
    // is preserved across Hot Module Replacement (HMR) reloads.
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;

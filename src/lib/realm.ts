import { App, Credentials } from 'realm-web';

// Replace with your Realm App ID from the MongoDB Realm UI
const REALM_APP_ID = process.env.NEXT_PUBLIC_REALM_APP_ID || 'chatterbox-realm-zhoxoin';

// Create a singleton Realm app instance
const app = new App({ id: REALM_APP_ID });

export { app, Credentials };
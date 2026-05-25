import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
} from 'firebase/auth';
import { connectFirestoreEmulator, doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const demoFirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-rideyellow.firebaseapp.com',
  projectId: 'demo-rideyellow',
  storageBucket: 'demo-rideyellow.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:rideyellow-demo',
};

const demoAccounts = {
  rider: {
    email: 'rider@rideyellow.test',
    password: 'RideYellow123!',
  },
  driver: {
    email: 'driver@rideyellow.test',
    password: 'RideYellow123!',
  },
};

const app = initializeApp(demoFirebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function ensureUser(email, password, displayName, role) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
    });

    if (role === 'driver') {
      await setDoc(doc(db, 'drivers', credential.user.uid), {
        uid: credential.user.uid,
        displayName,
        isOnline: false,
        totalTrips: 0,
        totalEarnings: 0,
        updatedAt: serverTimestamp(),
      });
    }

    console.log(`Seeded ${role}: ${email}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('email-already-in-use')) {
      console.log(`Already exists: ${email}`);
      return;
    }

    throw error;
  }
}

await ensureUser(
  demoAccounts.rider.email,
  demoAccounts.rider.password,
  'Demo Rider',
  'rider',
);
await ensureUser(
  demoAccounts.driver.email,
  demoAccounts.driver.password,
  'Demo Driver',
  'driver',
);

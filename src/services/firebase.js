import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyCabQdXJG6s4jqxhlGtQS2DKOtLHLH0h_E",
  authDomain: "compudoctor-lima.firebaseapp.com",
  projectId: "compudoctor-lima",
  storageBucket: "compudoctor-lima.firebasestorage.app",
  messagingSenderId: "483801095737",
  appId: "1:483801095737:web:51b43fa85ca54425fbf7e8"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app) 

export { auth, db, functions  }
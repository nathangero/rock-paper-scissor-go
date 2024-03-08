// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';


// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB52ewuYNMSiQRAetO6NIrrlyZ-FiRBveM",
  authDomain: "rock-paper-scissor-go.firebaseapp.com",
  databaseURL: "https://rock-paper-scissor-go-default-rtdb.firebaseio.com",
  projectId: "rock-paper-scissor-go",
  storageBucket: "rock-paper-scissor-go.appspot.com",
  messagingSenderId: "1024694031435",
  appId: "1:1024694031435:web:6e92b5c3ce237f587869ce",
  measurementId: "G-28FM52GECZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
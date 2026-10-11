const firebaseConfig = {
  apiKey: "AIzaSyDE11cAUZfJoZMMCF-eyqGDUioYDQSCWrs",
  authDomain: "tw-fpl-tour.firebaseapp.com",
  databaseURL: "https://tw-fpl-tour-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tw-fpl-tour",
  storageBucket: "tw-fpl-tour.firebasestorage.app",
  messagingSenderId: "1023019839565",
  appId: "1:1023019839565:web:e91650d5c475c54a63ec04"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const matchRef = database.ref('live_match');

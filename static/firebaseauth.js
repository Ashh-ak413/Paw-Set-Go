
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXSmA6bANZRZD1JVTQlgP-tie7AlCPS4s",
  authDomain: "login-akc.firebaseapp.com",
  projectId: "login-akc",
  storageBucket: "login-akc.firebasestorage.app",
  messagingSenderId: "863140044947",
  appId: "1:863140044947:web:2d74fe451268348c2bed66"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// Sign Up
const signUp = document.getElementById('submitSignUp');
signUp.addEventListener('click', async (event) => {
  event.preventDefault();

  const email = document.getElementById('rEmail').value;
  const password = document.getElementById('rPassword').value;
  const firstName = document.getElementById('fName').value;
  const lastName = document.getElementById('lName').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const todayStr = new Date().toISOString().split('T')[0];

    const userData = {
      email,
      firstName,
      lastName,
      lastLoginDate: todayStr,
      streak: 1
    };

    await setDoc(doc(db, "users", user.uid), userData);
    showMessage('Account Created Successfully', 'signUpMessage');
    window.location.href = 'Paw.html';

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      showMessage('Email Address Already Exists !!!', 'signUpMessage');
    } else {
      showMessage('Unable to create user', 'signUpMessage');
    }
  }
});

// Sign In
const signIn = document.getElementById('submitSignIn');
signIn.addEventListener('click', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    localStorage.setItem('loggedInUserId', user.uid);
    showMessage('Login is successful', 'signInMessage');

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const todayStr = new Date().toISOString().split('T')[0];

    let updatedStreak = 1;
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const lastLogin = new Date(userData.lastLoginDate);
      const today = new Date();
      const diffTime = today - lastLogin;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        updatedStreak = userData.streak + 1;
      } else if (diffDays === 0) {
        updatedStreak = userData.streak;
      }
    }

    await updateDoc(userRef, {
      lastLoginDate: todayStr,
      streak: updatedStreak
    });

    console.log("🔥 Current Streak:", updatedStreak);
    localStorage.setItem("streak", updatedStreak);
    setTimeout(() => {
    window.location.href = 'Paw.html';
}, 1000);

  } catch (error) {
    if (error.code === 'auth/invalid-credential') {
      showMessage('Incorrect Email or Password', 'signInMessage');
    } else {
      showMessage('Account does not Exist', 'signInMessage');
    }
  }
});

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  getAdditionalUserInfo,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = initializeApp({
  apiKey: "AIzaSyCc4PCiKC3c0yhjkh6f41IA_0fsSIlRQyM",
  authDomain: "n423-jb-fd21e.firebaseapp.com",
  projectId: "n423-jb-fd21e",
  storageBucket: "n423-jb-fd21e.appspot.com",
  messagingSenderId: "1081165082402",
  appId: "1:1081165082402:web:f1586c5d1dd2c11f4abf7b",
  measurementId: "G-SV09N97Y92",
});

const auth = getAuth(firebaseConfig);
const db = getFirestore(firebaseConfig);
var currentUser = auth.currentUser;
console.log(currentUser);

// functions that:
// handle authentication

//this function is necessary for auth.currentUser to work
function initAuthentication() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = auth.currentUser;
      console.log(currentUser);
      console.log("user is signed in");
    } else {
      console.log("user is signed out");
    }
  });
}

function login() {
  let email = $("#email").val();
  let password = $("#password").val();

  if (window.location.hash == "#/company-login") {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log("logged in");
        quickRoute("company-tickets");
      })
      .catch((error) => {
        console.log(error.code);
      });
  } else if (window.location.hash == "#/client-login") {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log("logged in");
        quickRoute("client-tickets");
      })
      .catch((error) => {
        console.log(error.code);
      });
  }
}

function logout() {
  signOut(auth)
    .then(() => {
      console.log("logged out");
      quickRoute("home");
    })
    .catch((error) => {
      console.log(error.code);
    });
}

async function createUser() {
  let firstName = $("#firstName").val();
  let lastName = $("#lastName").val();
  let email = $("#email").val();
  let password = $("#password").val();
  let role = "";
  if (window.location.hash == "#/company-signup") {
    role = "company";
  } else if (window.location.hash == "#/client-signup") {
    role = "client";
  }

  let newUser = {
    email: email,
    firstName: firstName,
    lastName: lastName,
    password: password,
    role: role,
  };

  createUserWithEmailAndPassword(auth, email, password).then(() => {
    addUserData(newUser);
  });

  if (window.location.hash == "#/company-signup") {
    quickRoute("company-tickets");
  } else if (window.location.hash == "#/client-signup") {
    quickRoute("client-tickets");
  }
}

async function addUserData(data) {
  try {
    // Getting the current user from the auth service
    const user = auth.currentUser;

    // Getting a reference to the user's document in the firestore database
    const userDocRef = doc(db, `TicketUsers/${user.uid}`);

    // Setting the document in the firestore database
    setDoc(userDocRef, data);
  } catch (e) {
    console.log(e);
  }
}

async function getCurrentUser() {
  try {
    // Getting the current user from the auth service
    const user = auth.currentUser;

    // Getting a reference to the user's document in the firestore database
    const userDocRef = doc(db, `TicketUsers/${user.uid}`);
    const docSnap = await getDoc(userDocRef);

    console.log(docSnap.data());
  } catch (e) {
    console.log(e);
  }
}

// functions that:
// handle ticket operations for a client

async function createTicket() {
  try {
    //construct a new ticket object
    const subject = $("#subject").val();
    const content = $("#content").val();

    const userRef = doc(db, "TicketUsers", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const user = userSnap.data();

    const newTicket = {
      subject: subject,
      content: [content],
      ownerId: userSnap.id,
      ownerName: user.firstName + " " + user.lastName,
      status: "ready",
    };

    await addDoc(collection(db, "Tickets"), newTicket).then(
      quickRoute("client-tickets")
    );
  } catch (e) {
    console.log(e);
  }
}

async function deleteTicket(e) {
  //get the id from the event
  const ticketId = e.currentTarget.id;

  //delete the document
  await deleteDoc(doc(db, "Tickets", ticketId));

  //clear the #viewTicket window
  $("#viewTicket").html("");

  //re-render the #allTickets window
  displayAllTickets();
}

async function deleteClientTicket(e) {
  //get the id from the event
  const ticketId = e.currentTarget.id;

  //delete the document
  await deleteDoc(doc(db, "Tickets", ticketId));

  //re-render the #ticket-list window
  displayClientTickets();
}

async function displayClientTickets() {
  //get the current user
  const user = auth.currentUser;

  //create a reference to the tickets collection
  const ticketsRef = collection(db, "Tickets");

  //create a query to return all tickets owned by the current user
  const q = query(ticketsRef, where("ownerId", "==", user.uid));

  //execute the query
  const querySnapshot = await getDocs(q);

  $("#ticket-list").html("");

  //loop through each ticket
  querySnapshot.forEach((doc) => {
    const ticket = doc.data();
    $("#ticket-list").append(`
    <div id="${doc.id}" class="ticket-card">
      <div class="status"></div>
      <h2>${ticket.subject}</h2>
      <h3>Client Name</h3>
    </div>`);
  });

  initClientTicketListeners();
}

async function viewClientTicket(id) {
  //clear the ticket area
  $("#ticket-list").html("");

  //get the ticket doc
  const docRef = doc(db, "Tickets", id);
  const docSnap = await getDoc(docRef);
  const ticket = docSnap.data();

  //append the detailed ticket view to the #ticket-list area
  $("#ticket-list").html(`
  <div id="${docSnap.id}" class="client-card">
    <div class="status"></div>
    <div class="client-card-header">
      <h2>${ticket.subject}</h2>
      <div class="flex">
        <div id="nevermind">
          <ion-icon name="arrow-round-back"></ion-icon>
        </div>
        <div id="${docSnap.id}" class="close">
          <ion-icon name="trash"></ion-icon>
        </div>
        <div class="reply">
          <ion-icon name="undo"></ion-icon>
        </div>
      </div>
    </div>
    <div class="client-card-content">
      <div id="reply-box">
        <textarea id="content" cols="30" rows="10" placeholder="Content"></textarea>
        <button id="${docSnap.id}" class="submit-reply">Send</button>
      </div>
    </div>
  </div>`);

  //loop through the ticket content backwards
  for (let i = ticket.content.length - 1; i >= 0; i--) {
    $(".client-card-content").append(`<hr /><p>${ticket.content[i]}</p>`);
  }

  //initialize the new listeners
  initReplyClientListeners();
}

async function updateClientTicket(e) {
  //get the ticket's id
  const ticketId = e.currentTarget.id;

  //get the content from the textarea
  const newContent = $("#content").val();

  //create a referene to the doc
  const docRef = doc(db, "Tickets", ticketId);

  //get the doc and create an object for it
  const docSnap = await getDoc(docRef);
  const ticketObj = docSnap.data();

  //add the new content to the end of the content array
  ticketObj.content.push(newContent);

  //set the doc with the new object
  await setDoc(doc(db, "Tickets", ticketId), ticketObj);

  //hide the reply box and clear it's contents
  $("#reply-box").css("display", "none");
  $("#reply-box").val("");

  //re-render the ticket
  viewClientTicket(ticketId);
}

// functions that:
// handle ticket operations for a company
async function displayAllTickets() {
  //clear the ticket list view
  $("#allTickets").html("");

  //get the tickets from the collection
  const querySnapshot = await getDocs(collection(db, "Tickets"));

  //loop through the data to display the tickets
  querySnapshot.forEach((doc) => {
    const ticket = doc.data();

    //get the user doc for the ticket owner
    // const docRef = doc(db, "TicketUsers", ticket.ownerId);
    // const userSnap = await getDoc(docRef);
    // const user = userSnap.data();

    $("#allTickets").append(`
    <div id="${doc.id}" class="ticket-card">
      <div class="status"></div>
      <h2>${ticket.subject}</h2>
      <h3>${ticket.ownerName}</h3>
    </div>
    `);
  });

  //add a click listener to each ticket item
  addCompanyTicketListeners();
}

async function viewTicket(id) {
  //clear the ticket view area
  $("#viewTicket").html("");

  //get the data for the clicked ticket
  const docRef = doc(db, "Tickets", id);
  const docSnap = await getDoc(docRef);
  const ticket = docSnap.data();

  //display the selected ticket's data
  $("#viewTicket").html(
    `
  <div class="ticketHeader flex space-between">
    <div>
      <h1>${ticket.subject}</h1>
      <h3>${ticket.ownerName}</h3>
    </div>
    <div>
      <div id="${docSnap.id}" class="close">
        <ion-icon name="trash"></ion-icon>
      </div>
      <div class="reply">
        <ion-icon name="undo"></ion-icon>
      </div>
    </div>
  </div>
  <div id="ticketBody" class="ticketBody">
    <div id="reply-box">
      <textarea id="content" cols="30" rows="10" placeholder="Content"></textarea>
      <button id="${docSnap.id}" class="submit-reply">Send</button>
    </div>
  </div>`
  );

  //loop through the ticket content backwards
  for (let i = ticket.content.length - 1; i >= 0; i--) {
    $("#ticketBody").append(`<p>${ticket.content[i]}</p><hr />`);
  }

  //listen for the reply button
  initReplyListeners();
}

function showReplyBox() {
  //show the reply box at the top of the ticket content viewport
  $("#reply-box").css("display", "flex");
}

async function updateTicket(e) {
  //get the ticket's id
  const ticketId = e.currentTarget.id;

  //get the content from the textarea
  const newContent = $("#content").val();

  //create a referene to the doc
  const docRef = doc(db, "Tickets", ticketId);

  //get the doc and create an object for it
  const docSnap = await getDoc(docRef);
  const ticketObj = docSnap.data();

  //add the new content to the end of the content array
  ticketObj.content.push(newContent);

  //set the doc with the new object
  await setDoc(doc(db, "Tickets", ticketId), ticketObj);

  //hide the reply box and clear it's contents
  $("#reply-box").css("display", "none");
  $("#reply-box").val("");

  //re-render the ticket
  viewTicket(ticketId);
}

// functions that:
// handle page navigation

function route() {
  //retrieve the desired page destination from the URL
  let hashTag = window.location.hash;
  let pageId = hashTag.replace("#/", "");

  console.log(pageId);

  //navigate to the page using the MODEL
  if (pageId == "client-tickets") {
    MODEL.navToPage(pageId, initListeners, displayClientTickets);
  } else if (pageId == "company-tickets") {
    MODEL.navToPage(pageId, initListeners, displayAllTickets);
  } else if (pageId == "") {
    MODEL.navToPage("home");
  } else {
    MODEL.navToPage(pageId, initListeners);
  }
}

function quickRoute(pageId) {
  window.location.hash = "#/" + pageId;
}

function initRouters() {
  route();
  $(window).on("hashchange", route);
}

// functions that:
// attach listeners to elements on the page

function initListeners() {
  //apply listeners to company login page
  $("#companyLoginBtn").on("click", login);

  //apply listeners to company login page
  $("#signup").on("click", createUser);

  //apply listeners to client login page
  $("#login").on("click", login);

  //apply listeners to all logout buttons
  $("#logout").on("click", logout);

  //apply listeners to client ticket buttons
  $("#createTicket").on("click", createTicket);
}

function initClientTicketListeners() {
  $("#ticket-list div").on("click", (e) => {
    const ticketId = e.currentTarget.id;
    viewClientTicket(ticketId);
  });
}

function addCompanyTicketListeners() {
  $("#allTickets div").on("click", (e) => {
    const ticketId = e.currentTarget.id;
    viewTicket(ticketId);
  });
}

function initReplyListeners() {
  //apply the reply listeners
  $(".reply").on("click", showReplyBox);
  $(".submit-reply").on("click", updateTicket);

  //apply the delete listener
  $(".close").on("click", deleteTicket);
}

function initReplyClientListeners() {
  //apply the reply listeners
  $(".reply").on("click", showReplyBox);
  $(".submit-reply").on("click", updateClientTicket);

  //apply the delete listener
  $(".close").on("click", deleteClientTicket);

  //apply the nevermind listener
  $("#nevermind").on("click", displayClientTickets);
}

// function that
// runs when the document loads

$(document).ready(() => {
  initRouters();
  initListeners();
  initAuthentication();
});

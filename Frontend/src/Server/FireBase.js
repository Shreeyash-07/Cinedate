import firebase from "firebase/compat/app";
import {
  onChildAdded,
  getDatabase,
  ref,
  push,
  onValue,
} from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyAWw3PQI29PiVyYAs8T7Wiq5gXj3LFuScE",
  databaseURL:
    "https://cinedate-4f67d-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = firebase.initializeApp(firebaseConfig);
export const database = getDatabase(app);

export const dbRef = ref(database, "Dates");

export const sendSignalingMessage = (message) => {
  console.log({ message: message });
  push(dbRef, message)
    .then((res) => {
      console.log({ res });
    })
    .catch((err) => {
      console.log({ err });
    });
};

export const listenForSignalingMessages = (id, callback) => {
  console.log({ idFromFireBase: id });

  const existingKeyRef = ref(database, "Dates/-NZ2Y4qLQiOyx0MblPSX");
  onValue(existingKeyRef, (snapshot) => {
    const data = snapshot.val();
    console.log({ data: data.sdp });
  });

  onChildAdded(existingKeyRef, (snapshot) => {
    console.log("Checked DB");
    const message = snapshot.val();
    callback(message);
    console.log({ snap: snapshot.ref });
    //   snapshot.ref.remove();
    // remove(snapshot.ref);
  });
};

import * as admin from "firebase-admin";

// Initialize Firebase Admin
// When running in emulator, we need to provide explicit configuration
// to prevent Firebase from trying to fetch credentials from GCP metadata service
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

if (isEmulator) {
    // In emulator mode, initialize with explicit project ID, storage bucket,
    // and a mock credential to avoid any GCP metadata calls
    admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || "red-experimental-semillas",
        storageBucket: "red-experimental-semillas.firebasestorage.app",
        credential: admin.credential.applicationDefault(),
    });

    // Set the emulator environment if not already set
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
    }
} else {
    // In production, use default initialization (uses service account from environment)
    admin.initializeApp();
}

import * as functions from "firebase-functions/v1";
import { app } from "./api/app"

const LOCATION = "europe-west1";
const firestore = admin.firestore();


export const api = functions.region(LOCATION).https.onRequest(app);

// AUTH
export const authOnCreate = functions.region(LOCATION)
    .auth.user().onCreate(async (user) => {
        console.log(`Creating document for user ${user.uid}`);
        const userRef = firestore.collection("users").doc(user.uid);

        await userRef.set({
            name: user.displayName,
            email: user.email,
            image: user.photoURL,
            roles: ["USER"],
            createdAt: new Date(),
            have: [],
            want: [],
            offer: [],
            emailNotifications: {
                notifyForumPosts: true,
                notifyNewProjects: true,
                notifyProjectUpdates: true,
            },
        });
    });

export const authOnDelete = functions.region(LOCATION)
    .auth.user().onDelete(async (user) => {
        console.log(`Deleting document for user ${user.uid}`);

        const userRef = firestore.collection("users").doc(user.uid);

        // Borrar la subcolección 'private'
        const privateRef = userRef.collection("private");
        const snapshot = await privateRef.get();

        // Eliminar todos los documentos dentro de la subcolección 'private'
        const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        // Borrar el documento principal del usuario
        await userRef.delete();

        console.log(`User ${user.uid} and 'private' subcollection deleted`);
    });

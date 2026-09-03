import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import firebaseConfigData from "../../firebase-applet-config.json";

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyDGgYXJjNy8A0GzuWsESenMMGldNoXKR0g",
  authDomain: firebaseConfigData.authDomain || "eclipseterminal-8e870.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "eclipseterminal-8e870",
  storageBucket: firebaseConfigData.storageBucket || "eclipseterminal-8e870.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "720475882088",
  appId: firebaseConfigData.appId || "1:720475882088:web:bc677ede42081d2eb9f1dd",
  measurementId: firebaseConfigData.measurementId || "G-LREHZHTHW9",
};

// Initialize or reuse Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target dedicated database instance if configured, or default
export const db: Firestore = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test utility
export async function testFirebaseConnection(): Promise<boolean> {
  if (typeof window === "undefined") return true;
  try {
    await getDocFromServer(doc(db, "_connection_test_", "ping"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("[Firebase] Offline or connecting...");
      return false;
    }
    // Expected to fail permission check for non-existent doc, which confirms reachability
    return true;
  }
}

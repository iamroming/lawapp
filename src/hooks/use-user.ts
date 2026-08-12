"use client";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseUidToUuid } from "@/lib/firebase/uid";

export interface AppUser {
  uid: string;
  uuid: string;
  email: string | null;
  displayName: string | null;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          uuid: firebaseUidToUuid(firebaseUser.uid),
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

"use client";
import React, { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { Avatar } from "@/components/ui/avatar";

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export function AdminHeader() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      }
    };
    getUser();
  }, []);

  return (
    <header className="h-14 lg:h-16 border-b border-gray-200 bg-white flex items-center justify-between pl-14 lg:pl-6 pr-3 lg:pr-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          Firm Owner
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          <p className="text-xs text-gray-500">Owner</p>
        </div>
        <Avatar
          name={user?.displayName || user?.email || "O"}
          size="md"
        />
      </div>
    </header>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { User, Lock, Camera, Save } from "lucide-react";
import toast from "react-hot-toast";
import { updatePassword } from "firebase/auth";
import { firebaseUidToUuid } from "@/lib/firebase/uid";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  firm_name: string;
  avatar_url: string | null;
  role: string;
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    firm_name: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", firebaseUidToUuid(user.uid))
          .single();

        if (data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            firm_name: data.firm_name || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const { error } = await dbWrite("profiles", "update", {
        full_name: formData.full_name,
        phone: formData.phone,
        firm_name: formData.firm_name,
      }, { id: firebaseUidToUuid(user.uid) });

      if (error) {
        console.error("Error saving profile:", error);
        toast.error(error || "Failed to save profile");
      } else {
        toast.success("Profile saved!");
        fetchProfile();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      await updatePassword(user, passwordData.newPassword);
      toast.success("Password updated successfully!");
      setChangingPassword(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("Error changing password:", error.message || JSON.stringify(error));
      toast.error(error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      const result = await uploadToCloudinary(file, "CaseFiles/avatars");

      const { error: updateError } = await dbWrite("profiles", "update", { avatar_url: result.secure_url }, { id: profile.id });

      if (updateError) {
        toast.error("Failed to update profile");
      } else {
        toast.success("Avatar updated!");
        fetchProfile();
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                name={profile?.full_name || "User"}
                src={profile?.avatar_url}
                size="lg"
                className="h-24 w-24"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-[var(--surface)] rounded-full shadow-md border cursor-pointer hover:bg-[var(--surface-subtle)]"
              >
                <Camera className="h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-[var(--text-secondary)]">{profile?.email}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Role: {profile?.role || "Member"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              disabled
              className="bg-[var(--background)]"
            />
            <p className="text-xs text-[var(--text-secondary)]">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Enter your phone number"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Firm Name</label>
            <Input
              value={formData.firm_name}
              onChange={(e) => setFormData((p) => ({ ...p, firm_name: e.target.value }))}
              placeholder="Enter your firm name"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {!changingPassword ? (
            <Button variant="outline" onClick={() => setChangingPassword(true)}>
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Updating..." : "Update Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({ newPassword: "", confirmPassword: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

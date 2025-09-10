"use client";

import { useSession } from "next-auth/react";
import { isAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  lastLogin: string;
  loginCount: number;
  permissions: string[];
  department: string;
  phone: string;
  location: string;
}

export default function AdminProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile>({
    name: "Ditokens Admin",
    email: "admin@ditokens.com",
    role: "SUPER ADMIN",
    avatar: "/api/placeholder/150/150",
    lastLogin: "2025-08-23T18:30:00Z",
    loginCount: 156,
    permissions: [
      "USER_MANAGEMENT",
      "PAYMENT_APPROVAL",
      "TOKEN_MANAGEMENT",
      "SYSTEM_SETTINGS",
      "REFERRAL_MANAGEMENT",
      "STAKING_MANAGEMENT",
      "AUDIT_LOGS",
      "FULL_ACCESS"
    ],
    department: "System Administration",
    phone: "+1 (555) 123-4567",
    location: "Global Operations Center"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminProfile>>({});

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadProfile();
  }, [status, session, router]);

  const loadProfile = async () => {
    try {
      // Mock data for demonstration
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading profile:", error);
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditForm(profile);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleInputChange = (field: keyof AdminProfile, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !isAdminUser(session)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Admin Profile</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Manage your administrative profile and permissions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <div className="p-6 text-center">
                <div className="mb-4">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-24 h-24 rounded-full mx-auto border-4 border-primary"
                  />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white mb-2">{profile.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{profile.email}</p>
                <span className="inline-flex px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">
                  {profile.role}
                </span>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Department:</span> {profile.department}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Location:</span> {profile.location}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Phone:</span> {profile.phone}
                  </p>
                </div>
                <button
                  onClick={handleEdit}
                  className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mt-6">
              <div className="p-4 border-b border-stroke dark:border-stroke-dark">
                <h3 className="text-lg font-medium text-black dark:text-white">Activity Stats</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Logins</span>
                  <span className="text-sm font-medium text-black dark:text-white">{profile.loginCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
                  <span className="text-sm font-medium text-black dark:text-white">
                    {new Date(profile.lastLogin).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Session Status</span>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <div className="p-4 border-b border-stroke dark:border-stroke-dark">
                <h3 className="text-lg font-medium text-black dark:text-white">Profile Information</h3>
              </div>
              
              {isEditing ? (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name || profile.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email || profile.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                        disabled
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Email address cannot be changed for security reasons
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone || profile.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editForm.department || profile.department}
                        onChange={(e) => handleInputChange("department", e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editForm.location || profile.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-stroke text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Full Name
                      </label>
                      <p className="text-black dark:text-white">{profile.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Email
                      </label>
                      <p className="text-black dark:text-white">{profile.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Phone
                      </label>
                      <p className="text-black dark:text-white">{profile.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Department
                      </label>
                      <p className="text-black dark:text-white">{profile.department}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Location
                      </label>
                      <p className="text-black dark:text-white">{profile.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Role
                      </label>
                      <p className="text-black dark:text-white">{profile.role}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark mt-6">
              <div className="p-4 border-b border-stroke dark:border-stroke-dark">
                <h3 className="text-lg font-medium text-black dark:text-white">Administrative Permissions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-black dark:text-white">{permission.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

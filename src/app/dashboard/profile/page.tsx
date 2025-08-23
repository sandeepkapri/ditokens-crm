"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    country: "",
    state: "",
  });
  const [updateHistory, setUpdateHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
    }
    
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        contact: "",
        country: "",
        state: "",
      });
      
      // Fetch profile update history
      fetchUpdateHistory();
    }
  }, [status, router, session]);

  const fetchUpdateHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/user/profile/history");
      if (response.ok) {
        const data = await response.json();
        setUpdateHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch update history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update session data if needed
        if (data.user) {
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            contact: data.user.contactNumber || "",
            country: data.user.country || "",
            state: data.user.state || "",
          });
        }
        setIsEditing(false);
        // You could add a success toast here
      } else {
        console.error("Profile update failed:", data.error);
        // You could add an error toast here
      }
    } catch (error) {
      console.error("Profile update error:", error);
      // You could add an error toast here
    }
  };

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Profile
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                Profile Picture
              </h3>
              
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Image
                    src={session.user?.image || "/images/user/user-03.png"}
                    alt="Profile Picture"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-gray-200 dark:border-gray-600"
                  />
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-opacity-90">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <h4 className="text-lg font-semibold text-black dark:text-white mb-1">
                  {session.user?.name || "Guest User"}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {session.user?.email || "guest@ditokens.com"}
                </p>
                
                {isEditing && (
                  <button className="w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    Change Picture
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="lg:col-span-2">
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
              <h3 className="text-lg font-medium text-black dark:text-white mb-4">
                Personal Information
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter contact number"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter country"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter state/province"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString()}
                      disabled
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex gap-4">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center justify-center rounded-md bg-gray-500 py-2 px-6 text-center font-medium text-white hover:bg-opacity-90"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="mt-8">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Account Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">0</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-success mb-1">0</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Staked Tokens</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-warning mb-1">$0.00</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Referral Earnings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Update History */}
        <div className="mt-8">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <h3 className="text-lg font-medium text-black dark:text-white mb-4">
              Profile Update History
            </h3>
            
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading history...</p>
              </div>
            ) : updateHistory.length > 0 ? (
              <div className="space-y-4">
                {updateHistory.map((update: any) => (
                  <div key={update.id} className="border-l-4 border-indigo-500 pl-4 py-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {update.field.charAt(0).toUpperCase() + update.field.slice(1)} updated
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          From: {update.oldValue || "Not set"} → To: {update.newValue || "Not set"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          IP: {update.ipAddress} • {new Date(update.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {update.updateType.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No updates yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your profile update history will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

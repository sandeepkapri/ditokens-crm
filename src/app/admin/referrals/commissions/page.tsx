"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAdminUser } from "@/lib/admin-auth";

interface CommissionRecord {
  id: string;
  referrerId: string;
  referrerEmail: string;
  referredUserId: string;
  referredUserEmail: string;
  amount: number;
  isPaid: boolean;
  month: number;
  year: number;
  createdAt: string;
  paidAt?: string;
}

export default function CommissionTracking() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isAdminUser(session)) {
      router.push("/auth/sign-in");
      return;
    }

    loadCommissions();
  }, [status, session, router]);

  const loadCommissions = async () => {
    try {
      const response = await fetch("/api/admin/commissions");
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform the API data to match our interface
        const transformedCommissions: CommissionRecord[] = data.commissions.map((comm: any) => ({
          id: comm.id,
          referrerId: comm.referrerId,
          referrerEmail: comm.referrer.email,
          referredUserId: comm.referredUserId,
          referredUserEmail: comm.referredUser.email,
          amount: comm.amount,
          isPaid: comm.isPaid,
          month: comm.month,
          year: comm.year,
          createdAt: comm.createdAt,
          paidAt: comm.paidAt,
        }));
        
        setCommissions(transformedCommissions);
      } else {
        console.error("Failed to load commissions:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading commissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesFilter = filter === "all" || 
                         (filter === "paid" && commission.isPaid) ||
                         (filter === "unpaid" && !commission.isPaid);
    const matchesSearch = commission.referrerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.referredUserEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalCommissions = commissions.reduce((sum, comm) => sum + comm.amount, 0);
  const paidCommissions = commissions.filter(comm => comm.isPaid).reduce((sum, comm) => sum + comm.amount, 0);
  const unpaidCommissions = totalCommissions - paidCommissions;

  const handleMarkAsPaid = async (commissionId: string) => {
    try {
      const response = await fetch("/api/admin/commissions/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          commissionId,
          action: "approve"
        }),
      });

      if (response.ok) {
        // Reload commissions to get updated data
        loadCommissions();
        alert("Commission marked as paid successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update commission");
      }
    } catch (error) {
      console.error("Error updating commission:", error);
      alert("Error updating commission");
    }
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
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Commission Tracking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage referral commission payments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Total Commissions</h3>
                <p className="text-3xl font-bold text-primary">${totalCommissions.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Paid Commissions</h3>
                <p className="text-3xl font-bold text-green-600">${paidCommissions.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Pending Payments</h3>
                <p className="text-3xl font-bold text-orange-600">${unpaidCommissions.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by referrer or referred user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
          >
            <option value="all">All Commissions</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {/* Commissions Table */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Commission Records ({filteredCommissions.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Referrer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Referred User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-black dark:text-white">{commission.referrerEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">{commission.referredUserEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-black dark:text-white">
                        ${commission.amount.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">
                        {commission.month}/{commission.year}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        commission.isPaid 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}>
                        {commission.isPaid ? "PAID" : "PENDING"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </p>
                      {commission.paidAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Paid: {new Date(commission.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        {!commission.isPaid && (
                          <button 
                            onClick={() => handleMarkAsPaid(commission.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Mark as Paid
                          </button>
                        )}
                        <button className="text-primary hover:text-primary-dark text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCommissions.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No commission records found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

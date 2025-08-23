"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface StakingReward {
  id: string;
  userId: string;
  userEmail: string;
  stakingAmount: number;
  apy: number;
  rewards: number;
  stakingPeriod: number;
  startDate: string;
  endDate: string;
  status: string;
  lastRewardDate: string;
  totalRewardsEarned: number;
}

export default function RewardsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<StakingReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.email !== "admin@ditokens.com") {
      router.push("/auth/sign-in");
      return;
    }

    loadRewards();
  }, [status, session, router]);

  const loadRewards = async () => {
    try {
      // Mock data for demonstration
      const mockRewards: StakingReward[] = [
        {
          id: "reward_001",
          userId: "user_001",
          userEmail: "john.doe@example.com",
          stakingAmount: 1000,
          apy: 12.5,
          rewards: 125.00,
          stakingPeriod: 3,
          startDate: "2025-01-15T00:00:00Z",
          endDate: "2028-01-15T00:00:00Z",
          status: "ACTIVE",
          lastRewardDate: "2025-08-15T00:00:00Z",
          totalRewardsEarned: 125.00,
        },
        {
          id: "reward_002",
          userId: "user_002",
          userEmail: "jane.smith@example.com",
          stakingAmount: 2500,
          apy: 12.5,
          rewards: 312.50,
          stakingPeriod: 3,
          startDate: "2025-02-20T00:00:00Z",
          endDate: "2028-02-20T00:00:00Z",
          status: "ACTIVE",
          lastRewardDate: "2025-08-20T00:00:00Z",
          totalRewardsEarned: 312.50,
        },
        {
          id: "reward_003",
          userId: "user_003",
          userEmail: "mike.johnson@example.com",
          stakingAmount: 500,
          apy: 12.5,
          rewards: 62.50,
          stakingPeriod: 3,
          startDate: "2025-03-10T00:00:00Z",
          endDate: "2028-03-10T00:00:00Z",
          status: "COMPLETED",
          lastRewardDate: "2025-08-10T00:00:00Z",
          totalRewardsEarned: 62.50,
        },
        {
          id: "reward_004",
          userId: "user_004",
          userEmail: "sarah.wilson@example.com",
          stakingAmount: 1500,
          apy: 12.5,
          rewards: 187.50,
          stakingPeriod: 3,
          startDate: "2025-04-05T00:00:00Z",
          endDate: "2028-04-05T00:00:00Z",
          status: "ACTIVE",
          lastRewardDate: "2025-08-05T00:00:00Z",
          totalRewardsEarned: 187.50,
        },
        {
          id: "reward_005",
          userId: "user_005",
          userEmail: "david.brown@example.com",
          stakingAmount: 3000,
          apy: 12.5,
          rewards: 375.00,
          stakingPeriod: 3,
          startDate: "2025-05-12T00:00:00Z",
          endDate: "2028-05-12T00:00:00Z",
          status: "ACTIVE",
          lastRewardDate: "2025-08-12T00:00:00Z",
          totalRewardsEarned: 375.00,
        },
      ];

      setRewards(mockRewards);
    } catch (error) {
      console.error("Error loading rewards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesFilter = filter === "all" || reward.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = reward.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalStaked = rewards.reduce((sum, reward) => sum + reward.stakingAmount, 0);
  const totalRewards = rewards.reduce((sum, reward) => sum + reward.totalRewardsEarned, 0);
  const activeStakes = rewards.filter(reward => reward.status === "ACTIVE").length;

  const handleDistributeRewards = async (rewardId: string) => {
    try {
      // Mock API call
      setRewards(prev => prev.map(reward => 
        reward.id === rewardId 
          ? { ...reward, lastRewardDate: new Date().toISOString() }
          : reward
      ));
      alert("Rewards distributed successfully!");
    } catch (error) {
      console.error("Error distributing rewards:", error);
      alert("Error distributing rewards");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user.email !== "admin@ditokens.com") {
    return null;
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-title-md2 font-bold text-black dark:text-white">Rewards Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage staking rewards distribution
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Total Staked</h3>
                <p className="text-3xl font-bold text-primary">{totalStaked.toLocaleString()} DIT</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Total Rewards</h3>
                <p className="text-3xl font-bold text-green-600">${totalRewards.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-stroke-dark dark:bg-box-dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">Active Stakes</h3>
                <p className="text-3xl font-bold text-orange-600">{activeStakes}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
              placeholder="Search by user email..."
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Rewards Table */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">
              Staking Rewards ({filteredRewards.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Staked Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    APY
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Rewards
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Reward
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-box-dark divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-black dark:text-white">{reward.userEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-black dark:text-white">
                        {reward.stakingAmount.toLocaleString()} DIT
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">{reward.apy}%</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-green-600">
                        ${reward.rewards.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">
                        {reward.stakingPeriod} years
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(reward.startDate).toLocaleDateString()} - {new Date(reward.endDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reward.status)}`}>
                        {reward.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black dark:text-white">
                        {new Date(reward.lastRewardDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        {reward.status === "ACTIVE" && (
                          <button 
                            onClick={() => handleDistributeRewards(reward.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Distribute Rewards
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

          {filteredRewards.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No reward records found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* APY Configuration */}
        <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-stroke-dark dark:bg-box-dark">
          <div className="p-4 border-b border-stroke dark:border-stroke-dark">
            <h3 className="text-lg font-medium text-black dark:text-white">APY Configuration</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Current APY (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="12.5"
                  className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Minimum Staking Period (Years)
                </label>
                <input
                  type="number"
                  defaultValue="3"
                  className="w-full px-3 py-2 border border-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:border-stroke-dark dark:bg-box-dark dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary">
                  Update Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

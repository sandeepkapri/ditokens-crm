import * as Icons from "../icons";

export const ADMIN_NAV_DATA = [
  {
    label: "ADMIN DASHBOARD",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "User Management",
        icon: Icons.User,
        items: [
          {
            title: "All Users",
            url: "/admin/users",
          },
          {
            title: "User Analytics",
            url: "/admin/users/analytics",
          },
        ],
      },
      {
        title: "Payment Management",
        icon: Icons.PieChart,
        items: [
          {
            title: "Withdrawal Approvals",
            url: "/admin/payments",
          },
          {
            title: "Transaction History",
            url: "/admin/payments/transactions",
          },
        ],
      },
      {
        title: "Token Management",
        icon: Icons.PieChart,
        items: [
          {
            title: "Token Statistics",
            url: "/admin/tokens",
          },
          {
            title: "Price Management",
            url: "/admin/tokens/price",
          },
        ],
      },
      {
        title: "Referral System",
        icon: Icons.PieChart,
        items: [
          {
            title: "Referral Overview",
            url: "/admin/referrals",
          },
          {
            title: "Commission Tracking",
            url: "/admin/referrals/commissions",
          },
        ],
      },
      {
        title: "Staking Management",
        icon: Icons.PieChart,
        items: [
          {
            title: "Staking Overview",
            url: "/admin/staking",
          },
          {
            title: "Rewards Management",
            url: "/admin/staking/rewards",
          },
        ],
      },
      {
        title: "System Management",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Change History",
            url: "/admin/history",
          },
          {
            title: "System Settings",
            url: "/admin/settings",
          },
          {
            title: "Audit Logs",
            url: "/admin/audit",
          },
        ],
      },
    ],
  },
  {
    label: "QUICK ACTIONS",
    items: [
      {
        title: "Approve Withdrawals",
        url: "/admin/payments",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "Update Token Price",
        url: "/admin/tokens",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "User Management",
        url: "/admin/users",
        icon: Icons.User,
        items: [],
      },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      {
        title: "Switch to User View",
        url: "/dashboard",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Admin Settings",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Profile Settings",
            url: "/admin/profile",
          },
          {
            title: "Security Settings",
            url: "/admin/security",
          },
        ],
      },
    ],
  },
];

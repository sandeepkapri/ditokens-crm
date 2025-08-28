import * as Icons from "../icons";

// Function to get navigation data based on user role
export const getAdminNavData = (isSuperAdmin: boolean) => [
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
            url: "/admin/token-price",
            // Both admin and superadmin can access
          },
          {
            title: "Supply Management",
            url: "/admin/token-supply",
            // Superadmin only - 50M limit management
          },
        ],
      },
      {
        title: "Commission Management",
        icon: Icons.PieChart,
        items: [
          {
            title: "Commission Settings",
            url: "/admin/commission-settings",
          },
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
        title: "Communication",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Notification Management",
            url: "/admin/notifications",
          },
          {
            title: "Send Messages",
            url: "/admin/messages",
          },
          {
            title: "Message History",
            url: "/admin/messages/history",
          },
        ],
      },

      {
        title: "System Management",
        icon: Icons.Alphabet,
        items: [
          {
            title: "System Settings",
            url: "/admin/settings",
          },
          {
            title: "Audit Logs",
            url: "/admin/logs",
          },
        ],
      },
    ],
  },
  ...(isSuperAdmin ? [
    {
      label: "SUPERADMIN ONLY",
      items: [
        {
          title: "System Administration",
          icon: Icons.PieChart,
          items: [
            {
              title: "User Role Management",
              url: "/admin/users/roles",
            },
            {
              title: "System Settings",
              url: "/admin/system/settings",
            },
            {
              title: "Database Management",
              url: "/admin/system/database",
            },
          ],
        },
        {
          title: "Advanced Analytics",
          icon: Icons.PieChart,
          items: [
            {
              title: "Platform Analytics",
              url: "/admin/analytics/platform",
            },
            {
              title: "Revenue Reports",
              url: "/admin/analytics/revenue",
            },
          ],
        },
        {
          title: "Withdrawal Management",
          icon: Icons.PieChart,
          items: [
            {
              title: "Withdrawal Approvals",
              url: "/admin/payments",
            },
          ],
        },
      ],
    }
  ] : []),
];

// Keep the original export for backward compatibility
export const ADMIN_NAV_DATA = getAdminNavData(false);

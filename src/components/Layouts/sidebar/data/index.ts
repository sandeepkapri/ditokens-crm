import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Token Management",
        icon: Icons.PieChart,
        items: [
          {
            title: "Overview",
            url: "/dashboard/tokens/overview",
          },
          {
            title: "Buy Tokens",
            url: "/dashboard/tokens/buy",
          },
          {
            title: "Stake Tokens",
            url: "/dashboard/tokens/stake",
          },
          {
            title: "Portfolio",
            url: "/dashboard/tokens/portfolio",
          },
        ],
      },
      {
        title: "Referrals",
        icon: Icons.PieChart,
        items: [
          {
            title: "Referral Link",
            url: "/dashboard/referrals/link",
          },
          {
            title: "Referral History",
            url: "/dashboard/referrals/history",
          },
        ],
      },
      {
        title: "Wallets",
        icon: Icons.PieChart,
        items: [
          {
            title: "Deposit Wallet",
            url: "/dashboard/wallets/deposit",
          },
          {
            title: "Withdrawal Wallet",
            url: "/dashboard/wallets/withdrawal",
          },
          
        ],
      },
      {
        title: "Support",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Live Chat",
            url: "#",
          },
          {
            title: "Support Tickets",
            url: "#",
          },
          {
            title: "Contact Support",
            url: "https://ditokens.com/contact-us/",
          },
        ],
      },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: Icons.User,
        items: [],
      },
  
      {
        title: "Settings",
        icon: Icons.Alphabet,
        items: [

          {
            title: "Account Settings",
            url: "/dashboard/settings",
          },
          {
            title: "Password Change",
            url: "/dashboard/security/password",
          },
          {
            title: "Login History",
            url: "/dashboard/security/login-history",
          },
        ],
      },

    ],
  },
  {
    label: "ANALYTICS",
    items: [
      {
        title: "Portfolio",
        icon: Icons.PieChart,
        items: [
          {
            title: "Portfolio Overview",
            url: "/dashboard/analytics/portfolio",
          },
          {
            title: "Performance Charts",
            url: "/dashboard/analytics/performance",
          },
          {
            title: "Asset Allocation",
            url: "/dashboard/analytics/allocation",
          },
        ],
      },
      {
        title: "Reports",
        icon: Icons.PieChart,
        items: [
          {
            title: "Monthly Report",
            url: "/dashboard/analytics/monthly-report",
          },
          {
            title: "Tax Report",
            url: "/dashboard/analytics/tax-report",
          },
          {
            title: "Trading Report",
            url: "/dashboard/analytics/trading-report",
          },
        ],
      },
    ],
  },
];

// Function to get navigation data with admin access for admin users
export const getNavData = (isAdmin: boolean) => {
  if (!isAdmin) return NAV_DATA;
  
  // Add admin access section for admin users
  return [
    ...NAV_DATA,
    {
      label: "ADMIN ACCESS",
      items: [
        {
          title: "Admin Dashboard",
          url: "/admin/dashboard",
          icon: Icons.User,
          items: [],
        },
      ],
    },
  ];
};

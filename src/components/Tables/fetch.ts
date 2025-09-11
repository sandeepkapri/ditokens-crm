import * as logos from "@/assets/logos";

export async function getTopProducts() {
  // Skip API call during build - just return fallback data
  return [
    { name: 'DIT Token', profit: 0, sales: 0, revenue: 0 },
    { name: 'USDT Staking', profit: 0, sales: 0, revenue: 0 },
    { name: 'ETH Mining', profit: 0, sales: 0, revenue: 0 }
  ];
}

export async function getInvoiceTableData() {
  // Skip API call during build - just return fallback data
  return [
    { id: '1', name: 'Sample Invoice', amount: 0, status: 'Paid', date: '2025-01-01' },
    { id: '2', name: 'Sample Invoice 2', amount: 0, status: 'Pending', date: '2025-01-02' }
  ];
}

export async function getTopChannels() {
  // Skip API call during build - just return fallback data
  return [
    { name: 'USDT Network', logo: 'USDT', visitors: 0, revenues: 0, sales: 0, conversion: 0 },
    { name: 'Ethereum', logo: 'ETH', visitors: 0, revenues: 0, sales: 0, conversion: 0 },
    { name: 'Bitcoin', logo: 'BTC', visitors: 0, revenues: 0, sales: 0, conversion: 0 }
  ];
}

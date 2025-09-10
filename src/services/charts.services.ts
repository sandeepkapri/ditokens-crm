export async function getDevicesUsedData(
  timeFrame?: "monthly" | "yearly" | (string & {}),
) {
  try {
    const response = await fetch('/api/admin/analytics/devices');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching device data:', error);
  }

  // Fallback data
  return [
    { name: "Desktop", percentage: 0.65, amount: 0 },
    { name: "Tablet", percentage: 0.1, amount: 0 },
    { name: "Mobile", percentage: 0.2, amount: 0 },
    { name: "Unknown", percentage: 0.05, amount: 0 },
  ];
}

export async function getPaymentsOverviewData(
  timeFrame?: "monthly" | "yearly" | (string & {}),
) {
  try {
    const response = await fetch(`/api/admin/analytics/payments?timeFrame=${timeFrame || 'monthly'}`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching payments data:', error);
  }

  // Fallback data
  return {
    received: [],
    due: []
  };
}

export async function getWeeksProfitData(timeFrame?: string) {
  try {
    const response = await fetch(`/api/admin/analytics/profit?timeFrame=${timeFrame || 'current'}`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching profit data:', error);
  }

  // Fallback data
  return {
    sales: [],
    revenue: []
  };
}

export async function getCampaignVisitorsData() {
  try {
    const response = await fetch('/api/admin/analytics/visitors');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching visitors data:', error);
  }

  // Fallback data
  return {
    total_visitors: 0,
    performance: 0,
    chart: []
  };
}

export async function getVisitorsAnalyticsData() {
  try {
    const response = await fetch('/api/admin/analytics/visitors-daily');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching daily visitors data:', error);
  }

  // Fallback data
  return [];
}

export async function getCostsPerInteractionData() {
  try {
    const response = await fetch('/api/admin/analytics/costs');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching costs data:', error);
  }

  // Fallback data
  return {
    avg_cost: 0,
    growth: 0,
    chart: []
  };
}
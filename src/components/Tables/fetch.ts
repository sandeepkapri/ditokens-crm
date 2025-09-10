import * as logos from "@/assets/logos";

export async function getTopProducts() {
  try {
    const response = await fetch('/api/admin/analytics/top-products');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching top products:', error);
  }

  // Fallback data
  return [];
}

export async function getInvoiceTableData() {
  try {
    const response = await fetch('/api/admin/analytics/invoices');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching invoice data:', error);
  }

  // Fallback data
  return [];
}

export async function getTopChannels() {
  try {
    const response = await fetch('/api/admin/analytics/channels');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching channels data:', error);
  }

  // Fallback data
  return [];
}

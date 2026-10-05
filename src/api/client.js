// ============================================================
// API CLIENT — REAL SQLITE BACKEND
// Connects to FastAPI running on http://localhost:8000
// ============================================================

const BASE_URL = 'http://localhost:8000';

async function fetchAPI(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    let msg = 'API Request Failed';
    try {
      const data = await res.json();
      msg = data.detail || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

// ---- CLASSES ----
export const classesApi = {
  getAll: async () => fetchAPI('/classes'),
  create: async (data) => fetchAPI('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) => fetchAPI(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) => fetchAPI(`/classes/${id}`, { method: 'DELETE' }),
};

// ---- STUDENTS ----
export const studentsApi = {
  getByClass: async (classId) => fetchAPI(`/students?classId=${classId}`),
  getAll: async () => fetchAPI('/students'),
  create: async (data) => fetchAPI('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) => fetchAPI(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: async (id) => fetchAPI(`/students/${id}/deactivate`, { method: 'POST' }),
  activate: async (id) => fetchAPI(`/students/${id}/activate`, { method: 'POST' }),
};

// ---- FEE SLIPS ----
export const feeSlipsApi = {
  getByStudent: async (studentId) => fetchAPI(`/fee-slips?studentId=${studentId}`),
  getByClassAndMonth: async (classId, month) => fetchAPI(`/fee-slips?classId=${classId}&month=${month}`),
  getAll: async (month = null) => fetchAPI(month ? `/fee-slips?month=${month}` : '/fee-slips'),
  generate: async (studentId, billingMonth, items = []) => {
    return fetchAPI('/fee-slips/generate', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, billing_month: billingMonth, items }),
    });
  },
  generateBatch: async (classId, billingMonth, items = []) => {
    return fetchAPI('/fee-slips/generate-batch', {
      method: 'POST',
      body: JSON.stringify({ class_id: classId, billing_month: billingMonth, items }),
    });
  },
  update: async (slipId, items = []) => {
    return fetchAPI(`/fee-slips/${slipId}`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },
  delete: async (slipId) => fetchAPI(`/fee-slips/${slipId}`, { method: 'DELETE' }),
};

// ---- PAYMENTS ----
export const paymentsApi = {
  recordPayment: async (slipId, data) => {
    return fetchAPI(`/payments/${slipId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ---- ANALYTICS ----
export const analyticsApi = {
  getDashboard: async (month = null) => {
    const query = month ? `?month=${month}` : '';
    return fetchAPI(`/analytics/dashboard${query}`);
  },
  getDefaulters: async () => fetchAPI('/analytics/defaulters'),
  getAvailableMonths: async () => fetchAPI('/analytics/months'),
  resetData: async () => {
    // Only applied for mock. For sqlite, maybe clear tables, but for now do nothing.
  }
};

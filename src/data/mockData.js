// ============================================================
// LITTLE SCHOLAR FEE MANAGEMENT SYSTEM — PERSISTENT MOCK DATA
// Persists in localStorage; ready to replace with FastAPI backend
// ============================================================

import { subMonths, format } from 'date-fns';

const STORAGE_KEYS = {
  CLASSES: 'ls_classes_v1',
  STUDENTS: 'ls_students_v1',
  FEE_SLIPS: 'ls_fee_slips_v1',
  FEE_ITEMS: 'ls_fee_items_v1',
  PAYMENTS: 'ls_payments_v1',
};

// ----- DEFAULT SEED DATA -----
const defaultClasses = [
  { id: 'cls-1', name: 'Nursery', section: 'A', base_tuition_fee: 3500, created_at: '2024-01-01' },
  { id: 'cls-2', name: 'Nursery', section: 'B', base_tuition_fee: 3500, created_at: '2024-01-01' },
  { id: 'cls-3', name: 'Class 1', section: 'A', base_tuition_fee: 4500, created_at: '2024-01-01' },
  { id: 'cls-4', name: 'Class 1', section: 'B', base_tuition_fee: 4500, created_at: '2024-01-01' },
  { id: 'cls-5', name: 'Class 2', section: 'A', base_tuition_fee: 5000, created_at: '2024-01-01' },
  { id: 'cls-6', name: 'Class 3', section: 'A', base_tuition_fee: 5500, created_at: '2024-01-01' },
  { id: 'cls-7', name: 'Class 4', section: 'A', base_tuition_fee: 6000, created_at: '2024-01-01' },
  { id: 'cls-8', name: 'Class 5', section: 'A', base_tuition_fee: 6500, created_at: '2024-01-01' },
];

const defaultStudents = [
  // Nursery A
  { id: 'stu-1',  class_id: 'cls-1', first_name: 'Ayesha',   last_name: 'Khan',      roll_number: 'NA-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Tariq Khan',    guardian_phone: '0312-3456789' },
  { id: 'stu-2',  class_id: 'cls-1', first_name: 'Bilal',    last_name: 'Ahmed',     roll_number: 'NA-002', custom_tuition_fee: null, is_active: true,  guardian_name: 'Rashid Ahmed',  guardian_phone: '0321-9876543' },
  { id: 'stu-3',  class_id: 'cls-1', first_name: 'Zara',     last_name: 'Siddiqui',  roll_number: 'NA-003', custom_tuition_fee: 2800, is_active: true,  guardian_name: 'Imran Siddiqui',guardian_phone: '0333-1122334' },
  { id: 'stu-4',  class_id: 'cls-1', first_name: 'Hassan',   last_name: 'Malik',     roll_number: 'NA-004', custom_tuition_fee: null, is_active: false, guardian_name: 'Usman Malik',   guardian_phone: '0345-5566778' },
  // Nursery B
  { id: 'stu-5',  class_id: 'cls-2', first_name: 'Fatima',   last_name: 'Ali',       roll_number: 'NB-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Ali Hassan',    guardian_phone: '0300-2233445' },
  { id: 'stu-6',  class_id: 'cls-2', first_name: 'Umar',     last_name: 'Sheikh',    roll_number: 'NB-002', custom_tuition_fee: null, is_active: true,  guardian_name: 'Asif Sheikh',   guardian_phone: '0311-6677889' },
  // Class 1-A
  { id: 'stu-7',  class_id: 'cls-3', first_name: 'Maryam',   last_name: 'Qureshi',   roll_number: '1A-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Zaheer Qureshi',guardian_phone: '0322-9988776' },
  { id: 'stu-8',  class_id: 'cls-3', first_name: 'Ibrahim',  last_name: 'Farooq',    roll_number: '1A-002', custom_tuition_fee: null, is_active: true,  guardian_name: 'Kamal Farooq',  guardian_phone: '0334-4455667' },
  { id: 'stu-9',  class_id: 'cls-3', first_name: 'Sana',     last_name: 'Raza',      roll_number: '1A-003', custom_tuition_fee: 3600, is_active: true,  guardian_name: 'Raza Hussain',  guardian_phone: '0346-7788990' },
  { id: 'stu-10', class_id: 'cls-3', first_name: 'Ahmed',    last_name: 'Butt',      roll_number: '1A-004', custom_tuition_fee: null, is_active: true,  guardian_name: 'Sajid Butt',    guardian_phone: '0301-1234567' },
  // Class 1-B
  { id: 'stu-11', class_id: 'cls-4', first_name: 'Nadia',    last_name: 'Javed',     roll_number: '1B-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Javed Iqbal',   guardian_phone: '0313-9988001' },
  { id: 'stu-12', class_id: 'cls-4', first_name: 'Omar',     last_name: 'Rizvi',     roll_number: '1B-002', custom_tuition_fee: null, is_active: true,  guardian_name: 'Rizvi Sahib',   guardian_phone: '0325-4455231' },
  // Class 2-A
  { id: 'stu-13', class_id: 'cls-5', first_name: 'Sara',     last_name: 'Nawaz',     roll_number: '2A-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Nawaz Shah',    guardian_phone: '0336-7654321' },
  { id: 'stu-14', class_id: 'cls-5', first_name: 'Ali',      last_name: 'Baig',      roll_number: '2A-002', custom_tuition_fee: 4000, is_active: true,  guardian_name: 'Baig Sahib',    guardian_phone: '0348-1122334' },
  { id: 'stu-15', class_id: 'cls-5', first_name: 'Hina',     last_name: 'Mirza',     roll_number: '2A-003', custom_tuition_fee: null, is_active: true,  guardian_name: 'Mirza Sb.',     guardian_phone: '0302-8877665' },
  // Class 3-A
  { id: 'stu-16', class_id: 'cls-6', first_name: 'Kamran',   last_name: 'Chaudhry',  roll_number: '3A-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Asim Chaudhry', guardian_phone: '0314-3344556' },
  { id: 'stu-17', class_id: 'cls-6', first_name: 'Madiha',   last_name: 'Tariq',     roll_number: '3A-002', custom_tuition_fee: null, is_active: true,  guardian_name: 'Tariq Sb.',     guardian_phone: '0326-6655443' },
  // Class 4-A
  { id: 'stu-18', class_id: 'cls-7', first_name: 'Salman',   last_name: 'Aslam',     roll_number: '4A-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Aslam Sb.',     guardian_phone: '0337-9988776' },
  { id: 'stu-19', class_id: 'cls-7', first_name: 'Aisha',    last_name: 'Cheema',    roll_number: '4A-002', custom_tuition_fee: null, is_active: true,  guardian_name: 'Cheema Sb.',    guardian_phone: '0349-2233445' },
  // Class 5-A
  { id: 'stu-20', class_id: 'cls-8', first_name: 'Hamza',    last_name: 'Gillani',   roll_number: '5A-001', custom_tuition_fee: null, is_active: true,  guardian_name: 'Gillani Sb.',   guardian_phone: '0303-5566778' },
];

const today = new Date(2026, 9, 5); // Oct 2026
const months = [
  format(subMonths(today, 3), 'yyyy-MM'), // Jul
  format(subMonths(today, 2), 'yyyy-MM'), // Aug
  format(subMonths(today, 1), 'yyyy-MM'), // Sep
  format(today, 'yyyy-MM'),              // Oct
];

function generateDefaultFeeData() {
  const slips = [];
  const items = [];
  const payments = [];
  let slipIdCounter = 1;
  let itemIdCounter = 1;
  let paymentIdCounter = 1;

  defaultStudents.filter(s => s.is_active).forEach(student => {
    let prevArrears = 0;

    months.forEach((month, mIdx) => {
      const slipId = `slip-${slipIdCounter++}`;
      const cls = defaultClasses.find(c => c.id === student.class_id);
      const tuition = student.custom_tuition_fee || (cls?.base_tuition_fee ?? 0);

      const slipItems = [];
      if (mIdx === 0 || mIdx === 2) {
        slipItems.push({ id: `item-${itemIdCounter++}`, fee_slip_id: slipId, title: 'Lab Fee', amount: 200 });
        slipItems.push({ id: `item-${itemIdCounter++}`, fee_slip_id: slipId, title: 'Library Fee', amount: 100 });
      }
      if (mIdx === 1 || mIdx === 3) {
        slipItems.push({ id: `item-${itemIdCounter++}`, fee_slip_id: slipId, title: 'Sports Fee', amount: 150 });
      }
      if (student.id === 'stu-7' && mIdx === 1) {
        slipItems.push({ id: `item-${itemIdCounter++}`, fee_slip_id: slipId, title: 'Exam Fee', amount: 500 });
      }
      if (student.id === 'stu-13') {
        slipItems.push({ id: `item-${itemIdCounter++}`, fee_slip_id: slipId, title: 'Transport', amount: 800 });
      }

      const miscTotal = slipItems.reduce((s, i) => s + i.amount, 0);
      const totalAmount = tuition + miscTotal + prevArrears;

      let paidAmount = 0;
      let status = 'unpaid';

      if (mIdx === 0) {
        paidAmount = totalAmount; status = 'paid';
      } else if (mIdx === 1) {
        if (['stu-1','stu-5','stu-7','stu-10','stu-13','stu-16','stu-18','stu-20'].includes(student.id)) {
          paidAmount = totalAmount; status = 'paid';
        } else {
          paidAmount = Math.floor(totalAmount * 0.6); status = 'partially_paid';
        }
      } else if (mIdx === 2) {
        if (['stu-1','stu-7','stu-13','stu-20'].includes(student.id)) {
          paidAmount = totalAmount; status = 'paid';
        } else if (['stu-5','stu-10','stu-16','stu-18'].includes(student.id)) {
          paidAmount = Math.floor(totalAmount * 0.5); status = 'partially_paid';
        } else {
          paidAmount = 0; status = 'unpaid';
        }
      } else {
        if (['stu-1','stu-20'].includes(student.id)) {
          paidAmount = totalAmount; status = 'paid';
        } else {
          paidAmount = 0; status = 'unpaid';
        }
      }

      slips.push({
        id: slipId,
        student_id: student.id,
        billing_month: month,
        tuition_amount: tuition,
        misc_total: miscTotal,
        previous_arrears: prevArrears,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        status,
        created_at: `${month}-01T00:00:00Z`,
      });

      items.push(...slipItems);

      if (paidAmount > 0) {
        payments.push({
          id: `pay-${paymentIdCounter++}`,
          fee_slip_id: slipId,
          amount_paid: paidAmount,
          payment_date: `${month}-05`,
          payment_method: ['cash', 'bank_transfer', 'cheque'][paymentIdCounter % 3],
          notes: '',
          created_at: `${month}-05T10:00:00Z`,
        });
      }

      prevArrears = totalAmount - paidAmount;
    });
  });

  return { slips, items, payments };
}

// ----- LOCAL STORAGE STORAGE HELPERS -----
function loadFromStorage(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.error('Failed to load from storage:', e);
    return defaultVal;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

// ----- STATE INITIALIZATION -----
export let mockClasses = loadFromStorage(STORAGE_KEYS.CLASSES, null);
export let mockStudents = loadFromStorage(STORAGE_KEYS.STUDENTS, null);
export let mockFeeSlips = loadFromStorage(STORAGE_KEYS.FEE_SLIPS, null);
export let mockFeeItems = loadFromStorage(STORAGE_KEYS.FEE_ITEMS, null);
export let mockPayments = loadFromStorage(STORAGE_KEYS.PAYMENTS, null);

if (!mockClasses || !mockStudents || !mockFeeSlips || !mockFeeItems || !mockPayments) {
  const defaultFeeData = generateDefaultFeeData();
  mockClasses = defaultClasses;
  mockStudents = defaultStudents;
  mockFeeSlips = defaultFeeData.slips;
  mockFeeItems = defaultFeeData.items;
  mockPayments = defaultFeeData.payments;

  saveToStorage(STORAGE_KEYS.CLASSES, mockClasses);
  saveToStorage(STORAGE_KEYS.STUDENTS, mockStudents);
  saveToStorage(STORAGE_KEYS.FEE_SLIPS, mockFeeSlips);
  saveToStorage(STORAGE_KEYS.FEE_ITEMS, mockFeeItems);
  saveToStorage(STORAGE_KEYS.PAYMENTS, mockPayments);
}

// Persist functions called by API operations
export function saveClasses() { saveToStorage(STORAGE_KEYS.CLASSES, mockClasses); }
export function saveStudents() { saveToStorage(STORAGE_KEYS.STUDENTS, mockStudents); }
export function saveFeeSlips() { saveToStorage(STORAGE_KEYS.FEE_SLIPS, mockFeeSlips); }
export function saveFeeItems() { saveToStorage(STORAGE_KEYS.FEE_ITEMS, mockFeeItems); }
export function savePayments() { saveToStorage(STORAGE_KEYS.PAYMENTS, mockPayments); }

export function resetToDefaultData() {
  localStorage.removeItem(STORAGE_KEYS.CLASSES);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.FEE_SLIPS);
  localStorage.removeItem(STORAGE_KEYS.FEE_ITEMS);
  localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
  window.location.reload();
}

// ----- COMPUTED HELPERS -----
export function getClassById(id) {
  return mockClasses.find(c => c.id === id) || null;
}

export function getStudentById(id) {
  return mockStudents.find(s => s.id === id) || null;
}

export function getStudentsByClass(classId) {
  return mockStudents.filter(s => s.class_id === classId);
}

export function getSlipsByStudent(studentId) {
  return mockFeeSlips.filter(sl => sl.student_id === studentId);
}

export function getSlipsByClassAndMonth(classId, month) {
  const studentIds = mockStudents.filter(s => s.class_id === classId).map(s => s.id);
  return mockFeeSlips.filter(sl => studentIds.includes(sl.student_id) && sl.billing_month === month);
}

export function getItemsForSlip(slipId) {
  return mockFeeItems.filter(i => i.fee_slip_id === slipId);
}

export function getPaymentsForSlip(slipId) {
  return mockPayments.filter(p => p.fee_slip_id === slipId);
}

export function getStudentActiveSlipCount(studentId) {
  return mockFeeSlips.filter(sl => sl.student_id === studentId && sl.status !== 'paid').length;
}

// ----- DASHBOARD ANALYTICS -----
export function getDashboardAnalytics(month = null) {
  const slips = month ? mockFeeSlips.filter(sl => sl.billing_month === month) : mockFeeSlips;

  const totalBilled   = slips.reduce((s, sl) => s + sl.total_amount, 0);
  const totalCollected = slips.reduce((s, sl) => s + sl.paid_amount, 0);
  const totalOutstanding = totalBilled - totalCollected;
  const paidCount = slips.filter(sl => sl.status === 'paid').length;
  const partialCount = slips.filter(sl => sl.status === 'partially_paid').length;
  const unpaidCount = slips.filter(sl => sl.status === 'unpaid').length;
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Class-wise breakdown
  const classBrk = mockClasses.map(cls => {
    const stuIds = mockStudents.filter(s => s.class_id === cls.id).map(s => s.id);
    const clsSlips = slips.filter(sl => stuIds.includes(sl.student_id));
    const billed = clsSlips.reduce((s, sl) => s + sl.total_amount, 0);
    const collected = clsSlips.reduce((s, sl) => s + sl.paid_amount, 0);
    return {
      class_name: `${cls.name}-${cls.section}`,
      billed,
      collected,
      outstanding: billed - collected,
      recovery_pct: billed > 0 ? Math.round((collected / billed) * 100) : 0,
    };
  }).filter(c => c.billed > 0);

  // Monthly trend (last 4 months)
  const monthlyTrend = months.map(m => {
    const ms = mockFeeSlips.filter(sl => sl.billing_month === m);
    return {
      month: m,
      billed: ms.reduce((s, sl) => s + sl.total_amount, 0),
      collected: ms.reduce((s, sl) => s + sl.paid_amount, 0),
    };
  });

  return { totalBilled, totalCollected, totalOutstanding, paidCount, partialCount, unpaidCount, collectionRate, classBrk, monthlyTrend };
}

// ----- DEFAULTERS -----
export function getDefaulters() {
  const studentMap = {};
  mockFeeSlips.forEach(sl => {
    if (sl.status !== 'paid') {
      if (!studentMap[sl.student_id]) studentMap[sl.student_id] = { cycles: 0, totalOwed: 0 };
      studentMap[sl.student_id].cycles++;
      studentMap[sl.student_id].totalOwed += (sl.total_amount - sl.paid_amount);
    }
  });
  return Object.entries(studentMap)
    .filter(([, v]) => v.cycles >= 1)
    .map(([studentId, v]) => {
      const stu = getStudentById(studentId);
      const cls = stu ? getClassById(stu.class_id) : null;
      return {
        student_id: studentId,
        name: stu ? `${stu.first_name} ${stu.last_name}` : 'Unknown',
        roll_number: stu?.roll_number,
        class_name: cls ? `${cls.name}-${cls.section}` : '',
        overdue_cycles: v.cycles,
        total_owed: v.totalOwed,
      };
    })
    .sort((a, b) => b.total_owed - a.total_owed);
}

export const availableMonths = months;
export { months };

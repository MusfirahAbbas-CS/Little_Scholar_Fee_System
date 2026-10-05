import datetime
import uuid
import os
from database import get_db, init_db, DATABASE_URL

def seed():
    init_db()
    with get_db() as conn:
        c = conn.cursor()
        
        # Check if already seeded
        res = c.execute("SELECT COUNT(*) as count FROM classes").fetchone()
        if res and res['count'] > 0:
            print("Database already seeded.")
            return

        now = datetime.datetime.utcnow().isoformat()
        
        classes = [
            ('cls-1', 'Nursery', 'A', 3500, now),
            ('cls-2', 'Nursery', 'B', 3500, now),
            ('cls-3', 'Class 1', 'A', 4500, now),
        ]
        for cls in classes:
            c.execute("INSERT INTO classes (id, name, section, base_tuition_fee, created_at) VALUES (?, ?, ?, ?, ?)", cls)
        
        students = [
            ('stu-1', 'cls-1', 'Ayesha', 'Khan', 'NA-001', 'Tariq Khan', '0312-3456789', None, True, now),
            ('stu-2', 'cls-1', 'Bilal', 'Ahmed', 'NA-002', 'Rashid Ahmed', '0321-9876543', None, True, now),
            ('stu-7', 'cls-3', 'Maryam', 'Qureshi', '1A-001', 'Zaheer Qureshi', '0322-9988776', None, True, now),
        ]
        for stu in students:
            c.execute("INSERT INTO students (id, class_id, first_name, last_name, roll_number, guardian_name, guardian_phone, custom_tuition_fee, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", stu)
        
        # 1 fee slip for stu-1
        slip_id = f"slip-{uuid.uuid4().hex[:8]}"
        month = "2026-10"
        c.execute(
            "INSERT INTO fee_slips (id, student_id, billing_month, tuition_amount, previous_arrears, misc_total, total_amount, paid_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (slip_id, 'stu-1', month, 3500, 0, 300, 3800, 0, 'unpaid', now)
        )
        c.execute("INSERT INTO fee_items (id, fee_slip_id, title, amount) VALUES (?, ?, ?, ?)", (f"item-{uuid.uuid4().hex[:8]}", slip_id, 'Lab Fee', 200))
        c.execute("INSERT INTO fee_items (id, fee_slip_id, title, amount) VALUES (?, ?, ?, ?)", (f"item-{uuid.uuid4().hex[:8]}", slip_id, 'Library', 100))
        
        print("Seeded database successfully.")

if __name__ == '__main__':
    seed()

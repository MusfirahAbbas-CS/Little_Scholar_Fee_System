from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
import uuid
import datetime
from pydantic import BaseModel
from typing import List, Optional, Any

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# --- Classes ---
class ClassCreate(BaseModel):
    name: str
    section: str
    base_tuition_fee: float

@app.get("/classes")
def get_classes():
    with get_db() as db:
        return db.cursor().execute("SELECT * FROM classes").fetchall()

@app.post("/classes")
def create_class(cls: ClassCreate):
    cls_id = f"cls-{uuid.uuid4().hex[:8]}"
    created_at = datetime.datetime.utcnow().isoformat()
    with get_db() as db:
        db.cursor().execute(
            "INSERT INTO classes (id, name, section, base_tuition_fee, created_at) VALUES (?, ?, ?, ?, ?)",
            (cls_id, cls.name, cls.section, cls.base_tuition_fee, created_at)
        )
        return db.cursor().execute("SELECT * FROM classes WHERE id=?", (cls_id,)).fetchone()

@app.put("/classes/{class_id}")
def update_class(class_id: str, cls: ClassCreate):
    with get_db() as db:
        db.cursor().execute(
            "UPDATE classes SET name=?, section=?, base_tuition_fee=? WHERE id=?",
            (cls.name, cls.section, cls.base_tuition_fee, class_id)
        )
        return db.cursor().execute("SELECT * FROM classes WHERE id=?", (class_id,)).fetchone()

@app.delete("/classes/{class_id}")
def delete_class(class_id: str):
    with get_db() as db:
        db.cursor().execute("DELETE FROM classes WHERE id=?", (class_id,))
    return {"success": True}

# --- Students ---
class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    roll_number: str
    class_id: str
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    custom_tuition_fee: Optional[float] = None

@app.get("/students")
def get_students(classId: Optional[str] = None):
    with get_db() as db:
        if classId:
            st = db.cursor().execute("SELECT * FROM students WHERE class_id=?", (classId,)).fetchall()
        else:
            st = db.cursor().execute("SELECT * FROM students").fetchall()
        for s in st:
            s['is_active'] = bool(s['is_active'])
        return st

@app.post("/students")
def create_student(stu: StudentCreate):
    stu_id = f"stu-{uuid.uuid4().hex[:8]}"
    created_at = datetime.datetime.utcnow().isoformat()
    with get_db() as db:
        db.cursor().execute(
            "INSERT INTO students (id, class_id, first_name, last_name, roll_number, guardian_name, guardian_phone, custom_tuition_fee, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)",
            (stu_id, stu.class_id, stu.first_name, stu.last_name, stu.roll_number, stu.guardian_name, stu.guardian_phone, stu.custom_tuition_fee, created_at)
        )
        student = db.cursor().execute("SELECT * FROM students WHERE id=?", (stu_id,)).fetchone()
        student['is_active'] = bool(student['is_active'])
        return student

@app.put("/students/{student_id}")
def update_student(student_id: str, stu: StudentCreate):
    with get_db() as db:
        db.cursor().execute(
            "UPDATE students SET class_id=?, first_name=?, last_name=?, roll_number=?, guardian_name=?, guardian_phone=?, custom_tuition_fee=? WHERE id=?",
            (stu.class_id, stu.first_name, stu.last_name, stu.roll_number, stu.guardian_name, stu.guardian_phone, stu.custom_tuition_fee, student_id)
        )
        student = db.cursor().execute("SELECT * FROM students WHERE id=?", (student_id,)).fetchone()
        student['is_active'] = bool(student['is_active'])
        return student

@app.post("/students/{student_id}/deactivate")
def deactivate_student(student_id: str):
    with get_db() as db:
        db.cursor().execute("UPDATE students SET is_active=FALSE WHERE id=?", (student_id,))
        student = db.cursor().execute("SELECT * FROM students WHERE id=?", (student_id,)).fetchone()
        student['is_active'] = False
        return student

@app.post("/students/{student_id}/activate")
def activate_student(student_id: str):
    with get_db() as db:
        db.cursor().execute("UPDATE students SET is_active=TRUE WHERE id=?", (student_id,))
        student = db.cursor().execute("SELECT * FROM students WHERE id=?", (student_id,)).fetchone()
        student['is_active'] = True
        return student

# --- Fee Slips ---
def get_slip_with_details(db, slip_id):
    slip = db.cursor().execute("SELECT * FROM fee_slips WHERE id=?", (slip_id,)).fetchone()
    if slip:
        slip['items'] = db.cursor().execute("SELECT * FROM fee_items WHERE fee_slip_id=?", (slip_id,)).fetchall()
        slip['payments'] = db.cursor().execute("SELECT * FROM payments WHERE fee_slip_id=?", (slip_id,)).fetchall()
        slip['student'] = db.cursor().execute("SELECT * FROM students WHERE id=?", (slip['student_id'],)).fetchone()
        if slip['student']:
            slip['student']['is_active'] = bool(slip['student']['is_active'])
    return slip

@app.get("/fee-slips")
def get_fee_slips(studentId: Optional[str] = None, classId: Optional[str] = None, month: Optional[str] = None):
    with get_db() as db:
        if studentId:
            slips = db.cursor().execute("SELECT * FROM fee_slips WHERE student_id=?", (studentId,)).fetchall()
        elif classId and month:
            slips = db.cursor().execute(
                "SELECT fs.* FROM fee_slips fs JOIN students s ON fs.student_id = s.id WHERE s.class_id=? AND fs.billing_month=?",
                (classId, month)
            ).fetchall()
        elif month:
            slips = db.cursor().execute("SELECT * FROM fee_slips WHERE billing_month=?", (month,)).fetchall()
        else:
            slips = db.cursor().execute("SELECT * FROM fee_slips").fetchall()
        
        return [get_slip_with_details(db, s['id']) for s in slips]

class FeeItemCreate(BaseModel):
    title: str
    amount: float

class GenerateSlip(BaseModel):
    student_id: str
    billing_month: str
    items: List[FeeItemCreate] = []

@app.post("/fee-slips/generate")
def generate_slip(data: GenerateSlip):
    with get_db() as db:
        c = db.cursor()
        
        exists = c.execute("SELECT id FROM fee_slips WHERE student_id=? AND billing_month=?", (data.student_id, data.billing_month)).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="Fee slip already exists for this student and month")
        
        student = c.execute("SELECT * FROM students WHERE id=?", (data.student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        cls = c.execute("SELECT * FROM classes WHERE id=?", (student['class_id'],)).fetchone()
        
        tuition = student['custom_tuition_fee'] if student['custom_tuition_fee'] is not None else (cls['base_tuition_fee'] if cls else 0)
        
        prev_slips = c.execute("SELECT total_amount, paid_amount FROM fee_slips WHERE student_id=? AND billing_month < ? ORDER BY billing_month DESC LIMIT 1", (data.student_id, data.billing_month)).fetchone()
        prev_arrears = max(0, prev_slips['total_amount'] - prev_slips['paid_amount']) if prev_slips else 0
        
        misc_total = sum([item.amount for item in data.items])
        total_amount = tuition + misc_total + prev_arrears
        slip_id = f"slip-{uuid.uuid4().hex[:8]}"
        created_at = datetime.datetime.utcnow().isoformat()
        
        c.execute(
            "INSERT INTO fee_slips (id, student_id, billing_month, tuition_amount, previous_arrears, misc_total, total_amount, paid_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'unpaid', ?)",
            (slip_id, data.student_id, data.billing_month, tuition, prev_arrears, misc_total, total_amount, created_at)
        )
        
        for item in data.items:
            item_id = f"item-{uuid.uuid4().hex[:8]}"
            c.execute(
                "INSERT INTO fee_items (id, fee_slip_id, title, amount) VALUES (?, ?, ?, ?)",
                (item_id, slip_id, item.title, item.amount)
            )
            
        return get_slip_with_details(db, slip_id)

class FeeSlipUpdate(BaseModel):
    items: List[FeeItemCreate] = []

@app.put("/fee-slips/{slip_id}")
def update_slip(slip_id: str, data: FeeSlipUpdate):
    with get_db() as db:
        c = db.cursor()
        slip = c.execute("SELECT * FROM fee_slips WHERE id=?", (slip_id,)).fetchone()
        if not slip:
            raise HTTPException(status_code=404, detail="Fee slip not found")
            
        if slip['paid_amount'] > 0:
            raise HTTPException(status_code=400, detail="Cannot edit a slip that has already received payments")
            
        # Delete old items
        c.execute("DELETE FROM fee_items WHERE fee_slip_id=?", (slip_id,))
        
        # Add new items
        misc_total = sum([item.amount for item in data.items])
        for item in data.items:
            item_id = f"item-{uuid.uuid4().hex[:8]}"
            c.execute(
                "INSERT INTO fee_items (id, fee_slip_id, title, amount) VALUES (?, ?, ?, ?)",
                (item_id, slip_id, item.title, item.amount)
            )
            
        total_amount = slip['tuition_amount'] + slip['previous_arrears'] + misc_total
        
        c.execute(
            "UPDATE fee_slips SET misc_total=?, total_amount=? WHERE id=?",
            (misc_total, total_amount, slip_id)
        )
        return get_slip_with_details(db, slip_id)

@app.delete("/fee-slips/{slip_id}")
def delete_slip(slip_id: str):
    with get_db() as db:
        c = db.cursor()
        slip = c.execute("SELECT * FROM fee_slips WHERE id=?", (slip_id,)).fetchone()
        if not slip:
            raise HTTPException(status_code=404, detail="Fee slip not found")
            
        # Delete cascade manually
        c.execute("DELETE FROM payments WHERE fee_slip_id=?", (slip_id,))
        c.execute("DELETE FROM fee_items WHERE fee_slip_id=?", (slip_id,))
        c.execute("DELETE FROM fee_slips WHERE id=?", (slip_id,))
        
    return {"success": True}

class GenerateBatch(BaseModel):
    class_id: str
    billing_month: str
    items: List[FeeItemCreate] = []

@app.post("/fee-slips/generate-batch")
def generate_batch(data: GenerateBatch):
    results = []
    with get_db() as db:
        students = db.cursor().execute("SELECT * FROM students WHERE class_id=? AND is_active=TRUE", (data.class_id,)).fetchall()
        for s in students:
            try:
                # generate internally
                c = db.cursor()
                exists = c.execute("SELECT id FROM fee_slips WHERE student_id=? AND billing_month=?", (s['id'], data.billing_month)).fetchone()
                if exists:
                    raise Exception("Already exists")
                    
                cls = c.execute("SELECT * FROM classes WHERE id=?", (s['class_id'],)).fetchone()
                tuition = s['custom_tuition_fee'] if s['custom_tuition_fee'] is not None else (cls['base_tuition_fee'] if cls else 0)
                
                prev_slips = c.execute("SELECT total_amount, paid_amount FROM fee_slips WHERE student_id=? AND billing_month < ? ORDER BY billing_month DESC LIMIT 1", (s['id'], data.billing_month)).fetchone()
                prev_arrears = max(0, prev_slips['total_amount'] - prev_slips['paid_amount']) if prev_slips else 0
                
                misc_total = sum([item.amount for item in data.items])
                total_amount = tuition + misc_total + prev_arrears
                slip_id = f"slip-{uuid.uuid4().hex[:8]}"
                created_at = datetime.datetime.utcnow().isoformat()
                
                c.execute(
                    "INSERT INTO fee_slips (id, student_id, billing_month, tuition_amount, previous_arrears, misc_total, total_amount, paid_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'unpaid', ?)",
                    (slip_id, s['id'], data.billing_month, tuition, prev_arrears, misc_total, total_amount, created_at)
                )
                
                for item in data.items:
                    item_id = f"item-{uuid.uuid4().hex[:8]}"
                    c.execute(
                        "INSERT INTO fee_items (id, fee_slip_id, title, amount) VALUES (?, ?, ?, ?)",
                        (item_id, slip_id, item.title, item.amount)
                    )
                
                slip = get_slip_with_details(db, slip_id)
                results.append({"student_id": s['id'], "slip": slip, "success": True})
            except Exception as e:
                results.append({"student_id": s['id'], "error": str(e), "success": False})
    return results

class PaymentCreate(BaseModel):
    amount_paid: float
    payment_date: str
    payment_method: str = 'cash'
    notes: Optional[str] = ''

@app.post("/payments/{slip_id}")
def record_payment(slip_id: str, data: PaymentCreate):
    with get_db() as db:
        c = db.cursor()
        slip = c.execute("SELECT * FROM fee_slips WHERE id=?", (slip_id,)).fetchone()
        if not slip:
            raise HTTPException(status_code=404, detail="Fee slip not found")
        
        outstanding = slip['total_amount'] - slip['paid_amount']
        if data.amount_paid > outstanding:
            raise HTTPException(status_code=400, detail=f"Payment exceeds outstanding balance of Rs. {outstanding}")
        
        pay_id = f"pay-{uuid.uuid4().hex[:8]}"
        created_at = datetime.datetime.utcnow().isoformat()
        c.execute(
            "INSERT INTO payments (id, fee_slip_id, amount_paid, payment_date, payment_method, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (pay_id, slip_id, data.amount_paid, data.payment_date, data.payment_method, data.notes, created_at)
        )
        
        new_paid_amount = slip['paid_amount'] + data.amount_paid
        status = 'paid' if new_paid_amount >= slip['total_amount'] else ('partially_paid' if new_paid_amount > 0 else 'unpaid')
        
        c.execute(
            "UPDATE fee_slips SET paid_amount=?, status=? WHERE id=?",
            (new_paid_amount, status, slip_id)
        )
        
        return c.execute("SELECT * FROM payments WHERE id=?", (pay_id,)).fetchone()

# --- Analytics ---
@app.get("/analytics/dashboard")
def get_dashboard(month: Optional[str] = None):
    with get_db() as db:
        c = db.cursor()
        
        if month:
            slips = c.execute("SELECT * FROM fee_slips WHERE billing_month=?", (month,)).fetchall()
        else:
            slips = c.execute("SELECT * FROM fee_slips").fetchall()
            
        total_billed = sum(s['total_amount'] for s in slips)
        total_collected = sum(s['paid_amount'] for s in slips)
        total_outstanding = total_billed - total_collected
        
        paid_count = sum(1 for s in slips if s['status'] == 'paid')
        partial_count = sum(1 for s in slips if s['status'] == 'partially_paid')
        unpaid_count = sum(1 for s in slips if s['status'] == 'unpaid')
        
        collection_rate = round((total_collected / total_billed) * 100) if total_billed > 0 else 0
        
        # Class-wise
        classes = c.execute("SELECT * FROM classes").fetchall()
        class_brk = []
        for cls in classes:
            stu_ids = [s['id'] for s in c.execute("SELECT id FROM students WHERE class_id=?", (cls['id'],)).fetchall()]
            cls_slips = [s for s in slips if s['student_id'] in stu_ids]
            
            billed = sum(s['total_amount'] for s in cls_slips)
            collected = sum(s['paid_amount'] for s in cls_slips)
            
            if billed > 0:
                class_brk.append({
                    "class_name": f"{cls['name']}-{cls['section']}",
                    "billed": billed,
                    "collected": collected,
                    "outstanding": billed - collected,
                    "recovery_pct": round((collected / billed) * 100) if billed > 0 else 0
                })
        
        # Monthly trend
        months_db = [r['billing_month'] for r in c.execute("SELECT DISTINCT billing_month FROM fee_slips ORDER BY billing_month DESC LIMIT 4").fetchall()]
        months_db.reverse()
        
        monthly_trend = []
        for m in months_db:
            ms_slips = c.execute("SELECT * FROM fee_slips WHERE billing_month=?", (m,)).fetchall()
            monthly_trend.append({
                "month": m,
                "billed": sum(s['total_amount'] for s in ms_slips),
                "collected": sum(s['paid_amount'] for s in ms_slips)
            })
            
        return {
            "totalBilled": total_billed,
            "totalCollected": total_collected,
            "totalOutstanding": total_outstanding,
            "paidCount": paid_count,
            "partialCount": partial_count,
            "unpaidCount": unpaid_count,
            "collectionRate": collection_rate,
            "classBrk": class_brk,
            "monthlyTrend": monthly_trend
        }

@app.get("/analytics/defaulters")
def get_defaulters():
    with get_db() as db:
        c = db.cursor()
        slips = c.execute("SELECT * FROM fee_slips WHERE status != 'paid'").fetchall()
        
        student_map = {}
        for s in slips:
            sid = s['student_id']
            if sid not in student_map:
                student_map[sid] = {"cycles": 0, "totalOwed": 0}
            student_map[sid]["cycles"] += 1
            student_map[sid]["totalOwed"] += (s['total_amount'] - s['paid_amount'])
            
        defaulters = []
        for sid, v in student_map.items():
            if v["cycles"] >= 1:
                stu = c.execute("SELECT * FROM students WHERE id=?", (sid,)).fetchone()
                if stu:
                    cls = c.execute("SELECT * FROM classes WHERE id=?", (stu['class_id'],)).fetchone()
                    defaulters.append({
                        "student_id": sid,
                        "name": f"{stu['first_name']} {stu['last_name']}",
                        "roll_number": stu['roll_number'],
                        "class_name": f"{cls['name']}-{cls['section']}" if cls else "",
                        "overdue_cycles": v["cycles"],
                        "total_owed": v["totalOwed"]
                    })
        
        defaulters.sort(key=lambda x: x["total_owed"], reverse=True)
        return defaulters

@app.get("/analytics/months")
def get_months():
    with get_db() as db:
        months_db = [r['billing_month'] for r in db.cursor().execute("SELECT DISTINCT billing_month FROM fee_slips ORDER BY billing_month DESC").fetchall()]
        return months_db

import os
import re
import psycopg2
import sqlite3
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv(override=True)

DATABASE_URL = os.environ.get("DATABASE_URL")
DB_PATH = os.path.join(os.path.dirname(__file__), 'scholar.db')

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

class SqliteToPostgresCursor:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, query, params=None):
        pg_query = query.replace('?', '%s')
        if params:
            self.cursor.execute(pg_query, params)
        else:
            self.cursor.execute(pg_query)
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row else None

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(row) for row in rows]

    @property
    def description(self):
        return self.cursor.description


class DbConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return SqliteToPostgresCursor(self.conn.cursor(cursor_factory=RealDictCursor))

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

@contextmanager
def get_db():
    if DATABASE_URL:
        # Use Postgres
        conn = psycopg2.connect(DATABASE_URL)
        wrapped_conn = DbConnectionWrapper(conn)
        try:
            yield wrapped_conn
        finally:
            wrapped_conn.commit()
            wrapped_conn.close()
    else:
        # Fallback to local SQLite if no URL is provided
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = dict_factory
        try:
            yield conn
        finally:
            conn.commit()
            conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Classes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS classes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                section TEXT NOT NULL,
                base_tuition_fee REAL NOT NULL,
                created_at TEXT
            )
        ''')
        
        # Students
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                class_id TEXT REFERENCES classes(id),
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                roll_number TEXT UNIQUE NOT NULL,
                guardian_name TEXT,
                guardian_phone TEXT,
                custom_tuition_fee REAL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TEXT
            )
        ''')
        
        # Fee Slips
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fee_slips (
                id TEXT PRIMARY KEY,
                student_id TEXT REFERENCES students(id),
                billing_month TEXT NOT NULL,
                tuition_amount REAL NOT NULL,
                previous_arrears REAL NOT NULL DEFAULT 0,
                misc_total REAL NOT NULL DEFAULT 0,
                total_amount REAL NOT NULL,
                paid_amount REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'unpaid',
                created_at TEXT
            )
        ''')
        
        # Fee Items
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fee_items (
                id TEXT PRIMARY KEY,
                fee_slip_id TEXT REFERENCES fee_slips(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                amount REAL NOT NULL
            )
        ''')
        
        # Payments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                fee_slip_id TEXT REFERENCES fee_slips(id) ON DELETE CASCADE,
                amount_paid REAL NOT NULL,
                payment_date TEXT NOT NULL,
                payment_method TEXT DEFAULT 'cash',
                notes TEXT,
                created_at TEXT
            )
        ''')

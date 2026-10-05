import psycopg2
import sys

def test_conn(url):
    try:
        conn = psycopg2.connect(url)
        print(f"Success for {url}")
        conn.close()
    except Exception as e:
        print(f"Failed for {url}: {e}")

if __name__ == '__main__':
    urls = [
        "postgresql://postgres.rlulqogpoqdwdtlpowhi:6*hRA6bQ%23%269.E8a@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
        "postgresql://postgres:6*hRA6bQ%23%269.E8a@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
        "postgresql://postgres.rlulqogpoqdwdtlpowhi:6*hRA6bQ%23%269.E8a@db.rlulqogpoqdwdtlpowhi.supabase.co:6543/postgres"
    ]
    for u in urls:
        test_conn(u)

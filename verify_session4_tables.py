#!/usr/bin/env python3
"""
Verify Session 4 tables exist in Supabase
"""

import psycopg2

# Database connection string
DATABASE_URL = "postgresql://postgres.xxxtbzypheuiniuqynas:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

try:
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    print("\nChecking for Session 4 tables...")

    # Check if tables exist
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('agentos_reps', 'webhook_events')
        ORDER BY table_name;
    """)

    tables = cursor.fetchall()

    if tables:
        print("\nSession 4 tables found:")
        for table in tables:
            print(f"  - {table[0]}")

            # Get column count
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = '{table[0]}';
            """)
            col_count = cursor.fetchone()[0]
            print(f"    Columns: {col_count}")

            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]};")
            row_count = cursor.fetchone()[0]
            print(f"    Rows: {row_count}")
    else:
        print("\nNo Session 4 tables found!")

    print("\nAll migrations applied:")
    cursor.execute("""
        SELECT version, name
        FROM supabase_migrations.schema_migrations
        ORDER BY version;
    """)

    migrations = cursor.fetchall()
    for migration in migrations:
        print(f"  - {migration[0]}: {migration[1]}")

    cursor.close()
    conn.close()

    print("\nVerification complete!")

except Exception as e:
    print(f"Error: {e}")

import sqlite3

conn = sqlite3.connect('trade_intelligence.db')
cur = conn.cursor()

cur.execute("SELECT DISTINCT size FROM trade_history WHERE ship_to_country = 'Belgium' AND size IS NOT NULL ORDER BY size")
sizes = cur.fetchall()
print('Belgium sizes (exact):', sizes)

cur.execute("SELECT DISTINCT size FROM trade_history WHERE size IS NOT NULL ORDER BY size LIMIT 30")
all_sizes = cur.fetchall()
print('All raw sizes:', all_sizes)

cur.execute("SELECT DISTINCT ship_to_country FROM trade_history WHERE ship_to_country LIKE '%elgi%'")
countries = cur.fetchall()
print('Belgium country variants:', countries)

cur.execute("SELECT size, ship_to_country, COUNT(*) FROM trade_history WHERE ship_to_country LIKE '%elgi%' GROUP BY size, ship_to_country")
rows = cur.fetchall()
print('Belgium size breakdown:', rows)

conn.close()

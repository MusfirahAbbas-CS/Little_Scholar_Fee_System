import dns.resolver

try:
    answers = dns.resolver.resolve('db.rlulqogpoqdwdtlpowhi.supabase.co', 'AAAA')
    for rdata in answers:
        print('IPv6:', rdata.address)
except Exception as e:
    print('Error IPv6:', e)

try:
    answers = dns.resolver.resolve('db.rlulqogpoqdwdtlpowhi.supabase.co', 'A')
    for rdata in answers:
        print('IPv4:', rdata.address)
except Exception as e:
    print('Error IPv4:', e)

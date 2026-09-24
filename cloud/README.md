# KRC GROUP Central Cloud

Architecture:

`KRC GROUP Desktop PCs → Render Web Service → PostgreSQL`

The Render service is the central API. PostgreSQL stores users, passwords, roles, module catalogue, permissions and activity logs. No laptop needs to stay powered on.

For a no-cost starting deployment, use Render Free for the API and a current free PostgreSQL service such as Neon. Free service quotas and inactivity policies can change, so check the provider dashboard before production use.

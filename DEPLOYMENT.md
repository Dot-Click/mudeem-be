# Deployment (Railway, Docker)

## MongoDB Atlas connection errors (SSL / crash on start)

If the app crashes with `MongoNetworkError` / `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` when connecting to MongoDB Atlas:

1. **Allow Railway (and any cloud) IPs in Atlas**
   - In [MongoDB Atlas](https://cloud.mongodb.com) go to **Network Access**.
   - Click **Add IP Address**.
   - Either add **Allow Access from Anywhere** (`0.0.0.0/0`) or add the specific outbound IPs of your Railway project (if you use fixed egress IPs).
   - Without this, Atlas rejects the connection and it often shows up as an SSL/TLS error.

2. **Docker image**
   - This project uses `node:18-slim` (not Alpine) to avoid known TLS/OpenSSL issues between Alpine and Atlas.

3. **Env on Railway**
   - Set `MONGO_URI` to your Atlas connection string (e.g. `mongodb+srv://user:pass@cluster....mongodb.net/yourdb`).

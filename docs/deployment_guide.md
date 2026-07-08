# Step-by-Step Render Deployment Guide (Unified Single-Link)

This guide describes how to deploy the entire fullstack Aegis Hostel Operations app on Render under **one single web service and one single link**. 

Instead of hosting the frontend and backend separately, the Express server has been configured to serve the built React files directly. This means:
- You only need to configure **one Web Service** on Render.
- You do **not** need a separate frontend service.
- There are **no CORS or API connection mismatch issues** since they run on the exact same domain.
- The client gets **one single URL** (e.g. `https://hostel-app.onrender.com`) to access everything.

---

## 💾 Step 1: Create a Free PostgreSQL Database on Render

1. Log in to [Render](https://dashboard.render.com/).
2. Click the **"New +"** button in the top header and select **"PostgreSQL"**.
3. Fill in the database details:
   - **Name**: `hostel-db`
   - **Database Name**: (leave default or set `hostel_db`)
   - **User**: (leave default or set `hostel_admin`)
   - **Region**: Select the region closest to your clients (e.g., Singapore, Oregon, Frankfurt).
   - **Instance Type**: Select **"Free"**.
4. Click **"Create Database"** at the bottom of the page.
5. Wait for the status to change to **"Available"** (usually takes 1–2 minutes).
6. Copy the **"Internal Database URL"** (used by backend hosted on Render). It looks like this:
   `postgres://hostel_admin:xxxx@hostel-db-xxx:5432/hostel_db`

---

## 🚀 Step 2: Deploy the Unified Service on Render

1. Go back to your Render Dashboard.
2. Click **"New +"** and select **"Web Service"**.
3. Select your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `hostel-management`
   - **Region**: (Must be the same region you selected for the PostgreSQL database!)
   - **Branch**: `main`
   - **Root Directory**: (Leave this completely **empty** so Render reads the repository root directory)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend && npx --prefix backend prisma generate && npx --prefix backend prisma db push
     ```
     *(This installs dependencies for both backend and frontend, builds the frontend, generates the database client, and pushes the tables to the PostgreSQL database in one go)*
   - **Start Command**: `node backend/server.js`
   - **Instance Type**: **"Free"**

5. Expand the **"Environment Variables"** section and click **"Add Environment Variable"**:
   - `DATABASE_URL`: Paste the **Internal Database URL** you copied in Step 1.
   - `JWT_SECRET`: Type a long random password string (e.g. `aegis_hostel_super_secret_production_key_2026`).
   - `NODE_ENV`: `production`

6. Click **"Create Web Service"** at the bottom.
7. Wait for the deploy logs to finish. Render will build the React frontend, generate the database tables, and start the server. Once the status changes to **"Live"**, copy the live URL generated at the top (e.g., `https://hostel-management.onrender.com`).

---

## 🎓 Step 3: Initialize default Admin Credentials (First Time Login)

Because you are deploying to a clean, fresh PostgreSQL database, there is no admin account registered yet. 

To seed the database with the default admin account:
1. In your local `.env` inside `backend/` directory, temporarily replace the `DATABASE_URL` line with the **External Database URL** of your Render database (you can copy this from the Render database page).
2. Open a terminal in the `backend` folder and run the seed script:
   ```bash
   npm run db:seed
   ```
3. This will write default hostels, rooms, and the admin user directly to the live Render database:
   - **Warden Login Email**: `manager@aegis.com`
   - **Warden Password**: `manager123`
4. **Important**: Change the `DATABASE_URL` in your local `backend/.env` back to what it was (or use a local database) so you don't overwrite production data when developing locally!

---

## 🔗 Step 4: Share the single link with the client!
Simply send the Web Service URL (e.g., `https://hostel-management.onrender.com`) to your client. 
- When they click it, the React frontend will load immediately.
- The login, room allocations, student registrations, fee bills, and reports will all work seamlessly on this single link.

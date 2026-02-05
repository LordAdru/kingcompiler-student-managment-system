# KingCompiler Academy Manager

A high-performance student management system built for single-admin academies.

## 🚀 Hosting on Netlify (Free Tier)

This application is designed to be hosted for free on Netlify as a static site. No complex build pipelines are required as it uses native ES Modules.

### Deployment Steps:
1. **GitHub**: Push this project to a new repository on your GitHub account.
2. **Netlify Dashboard**: 
   - Login to [Netlify](https://app.netlify.com/).
   - Click **"Add new site"** > **"Import an existing project"**.
   - Select **GitHub** and authorize.
   - Pick your repository.
3. **Site Configuration**:
   - **Build Command**: (Leave this empty)
   - **Publish Directory**: `.` (The current folder)
4. **Environment Variables**:
   - Go to **Site Settings** > **Environment Variables**.
   - (Optional) If you want to keep your Firebase keys private, move them from `services/firebase.ts` to Netlify environment variables and update the code to use `process.env`.
5. **Deploy**: Click **"Deploy site"**.

### Why Netlify?
- **_redirects**: The included `_redirects` file ensures that if you refresh the page while on `/students` or `/calendar`, Netlify will correctly route the request back to the React app instead of showing a 404.
- **netlify.toml**: Pre-configured headers for security and performance.
- **Fast Edge CDN**: Global delivery for snappy performance.

## 📁 Project Structure
- `/components`: UI Views (Dashboard, Students, etc.)
- `/services`: Firestore, Auth, and Business Logic
- `/types`: TypeScript definitions
- `/constants`: Academy Curriculum and Levels
- `_redirects`: Netlify SPA routing config

## 🛠 Tech Stack
- **React 19** (via ESM.sh)
- **Tailwind CSS**
- **Firebase** (Firestore & Auth)
- **Lucide Icons**
- **FullCalendar**

---
Developed by KingCompiler Team. Optimized for mobile and desktop operations.
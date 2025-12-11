# Connect GoDaddy Domain to Railway App

## Step 1: Get Your Railway App URL
1. Go to [Railway Dashboard](https://railway.app)
2. Select your **pawn-flow** project
3. Go to **Settings** → **Domain**
4. Copy your Railway URL (looks like: `your-app-xxxx.up.railway.app`)

## Step 2: Add Custom Domain in Railway (Optional but Recommended)
1. In Railway → Your project → **Settings** → **Domain**
2. Click **Add Domain**
3. Enter your GoDaddy domain (e.g., `yourdomainname.com`)
4. Railway will show you DNS records to add

## Step 3: Update DNS Records in GoDaddy

### Method 1: Using Railway's Custom Domain (Easiest)
1. Go to [GoDaddy Account](https://www.godaddy.com/account/)
2. Click **Manage All** → Select your domain
3. Go to **DNS** tab
4. Look for the DNS records Railway provided
5. Add/Update the DNS records (usually CNAME or A records):
   - **Type**: CNAME or A record (Railway will specify)
   - **Name/Host**: @ (for root domain) or www
   - **Value**: Railway's CNAME target or IP address

### Method 2: Point to Railway Using CNAME (Simple)
1. Go to [GoDaddy Account](https://www.godaddy.com/account/)
2. Click **Manage All** → Select your domain
3. Go to **DNS** tab
4. Find the **CNAME** records section
5. Edit or add:
   - **Host**: www
   - **Points to**: `your-app-xxxx.up.railway.app`
   - **TTL**: 3600

6. For root domain (@), add an A record or use GoDaddy's domain forwarding:
   - Go to **Domain Settings** → **Domain Forwarding**
   - Forwarding: `http://www.yourdomainname.com`

## Step 4: Update Railway App Settings

1. In Railway dashboard:
   - Go to your project → **Settings**
   - Under **Environment Variables**, add:
     ```
     DOMAIN=yourdomainname.com
     ```

2. Restart your app:
   - Go to **Deployments** → Click latest deployment
   - Click **Redeploy**

## Step 5: Verify DNS Propagation
1. Wait 5-30 minutes for DNS to propagate
2. Check status:
   ```powershell
   nslookup yourdomainname.com
   nslookup www.yourdomainname.com
   ```
3. Should show Railway's IP address

## Step 6: Test Connection
1. Open browser: `https://yourdomainname.com`
2. Should load your pawn shop app
3. Check if HTTPS works (Railway provides SSL automatically)

## Troubleshooting

### Domain Not Resolving
- Wait 24 hours for full DNS propagation
- Clear browser cache: Ctrl+Shift+Del
- Try incognito/private mode

### SSL Certificate Issues
- Railway auto-generates SSL
- Can take 5-10 minutes after DNS is set up
- Check Railway → Settings → Domain for certificate status

### App Not Loading
1. Check Railway app is running:
   ```
   Railway Dashboard → Deployments → Check status
   ```
2. Check environment variables match your domain
3. Verify DNS records are correct:
   ```powershell
   nslookup yourdomainname.com
   ```

## Quick Reference

| What | Where |
|------|-------|
| Railway URL | Railway Dashboard → Settings → Domain |
| GoDaddy DNS | GoDaddy Account → Manage Domain → DNS |
| Check DNS | PowerShell: `nslookup yourdomainname.com` |
| Restart App | Railway → Deployments → Redeploy |

## After Connection
- Your app: `https://yourdomainname.com`
- Railway still hosts: `https://your-app-xxxx.up.railway.app` (works too)
- Frontend: Same domain as backend
- API calls: Should work automatically if CORS is set up

---

**Need help?** Check your Railway logs:
Railway → Your Project → Logs (check for any errors)

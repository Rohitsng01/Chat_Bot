# Deploy to Vercel

This project is ready to be deployed to Vercel!

## Quick Deployment Steps:

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your project**:
   ```bash
   vercel
   ```

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Vercel will auto-detect Vite settings
5. Add your environment variable:
   - Key: `VITE_GEMINI_API_KEY`
   - Value: [Your Gemini API Key]
6. Click "Deploy"

## Important: Environment Variables

⚠️ **Don't forget to add your API key as an environment variable in Vercel!**

In Vercel Dashboard:
- Go to Project Settings → Environment Variables
- Add: `VITE_GEMINI_API_KEY` = `your-api-key-here`
- Apply to: Production, Preview, and Development

## Build Configuration

Vercel will automatically use these settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## After Deployment

Your app will be live at: `https://your-project-name.vercel.app`

You can also:
- Add a custom domain
- Enable automatic deployments from Git
- View deployment logs and analytics

# 🚀 Production Deployment Guide for File Uploads

This guide ensures your ImageGen app's file upload functionality works correctly in production.

## ✅ Pre-Deployment Checklist

### 1. Run Production Readiness Check
```bash
npm run check:production
```

This script will verify:
- Environment variables are configured
- Supabase connection works
- Database connection is stable
- File upload limits are set
- Sharp image processing is available

### 2. Environment Variables Setup

**Required for Production:**
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_supabase_postgres_url
DIRECT_URL=your_supabase_direct_url

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
AUTH_SECRET=your_32_character_secret

# Optional
UPLOAD_MAX_SIZE_BYTES=10485760  # 10MB default
```

### 3. Supabase Storage Policies Setup

You **must** manually create these policies in your Supabase dashboard:

1. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/policies`
2. Create the following policies for the `images` bucket:

**SELECT Policy (Public Access):**
```sql
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');
```

**INSERT Policy (Authenticated Uploads):**
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');
```

**DELETE Policy (Authenticated Deletes):**
```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');
```

## 🔧 Platform-Specific Configuration

### Vercel Deployment

1. **Environment Variables**: Set all required environment variables in Vercel dashboard
2. **Build Settings**: 
   - Framework: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm ci`
3. **Function Regions**: Configure to match your Supabase region for optimal performance

### Netlify Deployment

1. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
2. **Environment Variables**: Set in Netlify dashboard
3. **Functions**: Ensure Node.js runtime is available for API routes

### Railway/Render Deployment

1. **Environment Variables**: Configure in platform dashboard
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`

## 🧪 Post-Deployment Testing

### 1. Automated Testing
```bash
# Run this with production environment variables
npm run check:production
```

### 2. Manual Testing Steps

1. **Upload Test**: Try uploading different image formats (PNG, JPEG, WebP)
2. **Size Limits**: Test with images larger than 10MB (should be compressed)
3. **Gallery**: Verify uploaded images appear in the gallery
4. **Generation**: Test image-to-image generation with uploaded base images

### 3. Performance Monitoring

Monitor these metrics:
- **Upload Success Rate**: Should be >99%
- **Image Processing Time**: Typically <5 seconds for large images
- **Storage Usage**: Track Supabase storage consumption
- **CDN Performance**: Monitor image loading times

## 🚨 Troubleshooting Common Issues

### Upload Fails with "No file provided"
- **Cause**: Multipart form data not properly parsed
- **Solution**: Ensure `export const runtime = "nodejs"` in upload routes

### Images Not Appearing
- **Cause**: Missing storage policies
- **Solution**: Verify Supabase storage policies are correctly configured

### Upload Timeout Errors
- **Cause**: Large image processing taking too long
- **Solution**: 
  - Verify Sharp is installed: `npm list sharp`
  - Check Vercel function timeout limits
  - Consider client-side image resizing for very large images

### CORS Errors in Production
- **Cause**: Supabase CORS configuration
- **Solution**: Add your production domain to Supabase CORS settings

### Database Connection Issues
- **Cause**: Incorrect DATABASE_URL or connection pooling
- **Solution**: 
  - Use connection pooling URL for DATABASE_URL
  - Use direct URL for DIRECT_URL
  - Check Supabase connection limits

## 📊 Production Monitoring

### Key Metrics to Track

1. **Upload Volume**: Number of uploads per day
2. **Storage Growth**: Supabase storage usage trends
3. **Error Rates**: Failed uploads and generations
4. **Performance**: Image processing and upload times

### Recommended Tools

- **Supabase Dashboard**: Monitor storage usage and database performance
- **Vercel Analytics**: Track function performance and errors
- **Custom Logging**: Add structured logging for upload events

## 🔄 Maintenance Tasks

### Regular Tasks

1. **Monitor Storage Usage**: Check Supabase storage limits
2. **Review Error Logs**: Investigate failed uploads
3. **Update Dependencies**: Keep Sharp and Supabase client updated
4. **Test Upload Flow**: Regular manual testing of upload functionality

### Monthly Tasks

1. **Storage Cleanup**: Remove test/temporary files if needed
2. **Performance Review**: Analyze upload success rates and times
3. **Security Review**: Verify storage policies and access controls

## 🆘 Emergency Procedures

### Upload Service Down

1. Check Supabase status: https://status.supabase.com/
2. Verify environment variables haven't changed
3. Test with `npm run check:production`
4. Check Vercel function logs for errors

### Storage Full

1. Check Supabase storage usage in dashboard
2. Upgrade storage plan if needed
3. Implement storage cleanup if necessary

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/storage
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Sharp Documentation**: https://sharp.pixelplumbing.com/

---

**✅ Your file upload system is now production-ready!**

Remember to run `npm run check:production` before each deployment to ensure everything is properly configured.

# Supabase Setup Guide

This guide will help you set up Supabase for your ImageGen app to store images and data.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "imagegen-ig")
5. Enter a strong database password
6. Select a region close to your users
7. Click "Create new project"

## 2. Configure Storage

### Create Storage Bucket

1. In your Supabase dashboard, go to "Storage" in the left sidebar
2. Click "Create bucket"
3. Name it `images`
4. Set it to **Public** (so images can be directly accessed via URLs)
5. Click "Create bucket"

### Set up Storage Policies

1. Go to Storage > Policies
2. For the `images` bucket, you'll need policies for:
   - **INSERT**: Allow authenticated users to upload images
   - **SELECT**: Allow public access to view images
   - **DELETE**: Allow authenticated users to delete their own images

Example policies:

**INSERT Policy:**
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');
```

**SELECT Policy:**
```sql
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');
```

**DELETE Policy:**
```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');
```

## 3. Get Environment Variables

1. In your Supabase dashboard, go to "Settings" > "API"
2. Copy the following values:

```bash
# Your Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Your anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Your service role key (keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Database Connection

Your app is already using PostgreSQL through Prisma. If you want to use Supabase's PostgreSQL:

1. Go to "Settings" > "Database"
2. Copy the connection string
3. Update your `.env` file:

```bash
# Use Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

## 5. Migration

### From File Storage to Supabase Storage

If you have existing images stored locally or in ImageBlob, you can migrate them:

1. **Update your environment variables** with the Supabase credentials
2. **Run a Prisma migration** to remove the ImageBlob model:
   ```bash
   npx prisma db push
   ```
3. **The app will now store new images in Supabase Storage** automatically

### Migrating Existing Images (Optional)

If you have existing images in the database, you could create a migration script to move them to Supabase Storage, but since this is a development project, you might prefer to start fresh.

## 6. Benefits of This Setup

✅ **Scalable**: Supabase handles image storage and CDN  
✅ **Cost-effective**: Pay only for what you use  
✅ **Fast**: Global CDN for image delivery  
✅ **Secure**: Row-level security policies  
✅ **Reliable**: Automatic backups and high availability  
✅ **Simple**: No need to manage file systems or blob storage manually  

## 7. Testing

After setup, test your integration:

1. Upload an image through your app
2. Check that it appears in Supabase Storage > images bucket
3. Verify the image is accessible via the public URL
4. Test image deletion

Your app will now use Supabase for both database and file storage, eliminating the need for local JSON files and database blob storage!

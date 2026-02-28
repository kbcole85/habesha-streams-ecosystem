

## Plan: Signed URLs + Video Bucket Security Hardening

### Current Problem
The `videos` storage bucket is currently **private** (good), but video URLs stored in `videos.video_url` are **public URLs** generated via `getPublicUrl()` — which won't work for a private bucket. We need to switch to **signed URLs** generated on-demand with short expiration, and ensure the bucket stays private.

### What's Already Correct
- Access hierarchy in `Watch.tsx` (lines 162-167): Admin → Test Code → PPV → Subscription -- logic is correct
- VideoPlayer has `controlsList="nodownload"`, `onContextMenu` disabled, watermark overlay
- Videos bucket is already private (`is_public: false`)

### Implementation Steps

1. **Create a `get-signed-video-url` backend function**
   - New edge function: `supabase/functions/get-signed-video-url/index.ts`
   - Accepts `videoId` in request body
   - Validates auth: checks Admin → Test Code → PPV purchase → Subscription (server-side)
   - Uses service role to call `storage.from("videos").createSignedUrl(path, 3600)` (1-hour expiry)
   - Returns `{ signedUrl }` or `403`

2. **Update `Watch.tsx` to fetch signed URL instead of using raw `video_url`**
   - After access is confirmed client-side, call the edge function to get a signed URL
   - Pass the signed URL to `VideoPlayer` instead of the raw storage URL
   - Add a new state `signedVideoUrl` and a fetch effect

3. **Update `VideoUploadModal.tsx` to store relative path, not full public URL**
   - After upload, store just the storage path (e.g. `userId/timestamp-file.mp4`) in `video_url` column instead of the full public URL
   - This lets the edge function generate signed URLs from the path

4. **Add basic anti-download CSS/JS to VideoPlayer** (already partially done)
   - Confirm `controlsList="nodownload"` is set
   - Confirm right-click is disabled
   - These are already in place -- no changes needed

### What This Does NOT Solve (by design)
- OS-level screen recording (impossible on web)
- Screen mirroring (requires native app + DRM)
- Full DRM encryption (requires Mux/Cloudflare Stream, not Supabase Storage)

### Technical Details

**Edge function access validation order:**
```text
1. Verify JWT → get user_id
2. Fetch video row → get video_url (path), monetization_type
3. Check user_roles for admin → allow
4. Check subscriptions for test_code_ prefix → allow
5. If PPV → check payments table for video_id match → allow/deny
6. If subscription → check profiles.is_subscribed → allow/deny
7. Return signed URL or 403
```

**Storage path format change:**
```text
Before: https://xxx.supabase.co/storage/v1/object/public/videos/userId/123-file.mp4
After:  userId/123-file.mp4  (stored in DB)
```

The signed URL will be generated server-side with 1-hour expiry, preventing URL sharing.


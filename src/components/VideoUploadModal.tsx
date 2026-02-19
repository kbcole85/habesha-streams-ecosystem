import { useState, useRef, useCallback } from "react";
import {
  Upload, X, CheckCircle, Film, Image as ImageIcon,
  DollarSign, Tag, Clock, AlertCircle, Loader2, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

const GENRES = ["Drama", "Documentary", "Music", "Comedy", "Romance", "Thriller", "Action", "Cultural", "History", "Sport"];
const AGE_RATINGS = ["G", "PG", "PG-13", "R", "18+"];
const STEPS = ["Video File", "Details", "Monetization", "Review"];

const VideoUploadModal = ({ onClose, onSuccess }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // File state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoDragging, setVideoDragging] = useState(false);
  const [thumbDragging, setThumbDragging] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);

  // Form state
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    full_description: "",
    genre: "",
    age_rating: "PG",
    runtime: "",
    monetization_type: "subscription",
    price: "",
    tags: "",
    trailer_url: "",
  });

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleVideoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setVideoDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) setVideoFile(file);
    else toast({ title: "Invalid file", description: "Please drop a video file.", variant: "destructive" });
  }, []);

  const handleThumbDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setThumbDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      toast({ title: "Invalid file", description: "Please drop an image.", variant: "destructive" });
    }
  }, []);

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 0) return !!videoFile;
    if (step === 1) return !!form.title.trim() && !!form.genre;
    if (step === 2) return form.monetization_type === "subscription" || (!!form.price && !isNaN(Number(form.price)));
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user || !videoFile) return;
    setSubmitting(true);
    try {
      // 1. Upload thumbnail
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbPath = `${user.id}/${Date.now()}_${thumbnailFile.name.replace(/\s/g, "_")}`;
        setThumbProgress(20);
        const { error: thumbErr } = await supabase.storage
          .from("thumbnails")
          .upload(thumbPath, thumbnailFile, { upsert: true });
        if (!thumbErr) {
          const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(thumbPath);
          thumbnailUrl = urlData.publicUrl;
        }
        setThumbProgress(100);
      }

      // 2. Upload video file
      const videoPath = `${user.id}/${Date.now()}_${videoFile.name.replace(/\s/g, "_")}`;
      setVideoProgress(10);

      // Simulate chunked progress visually
      const progressInterval = setInterval(() => {
        setVideoProgress(p => Math.min(p + 8, 85));
      }, 400);

      const { error: videoErr } = await supabase.storage
        .from("videos")
        .upload(videoPath, videoFile, { upsert: true });

      clearInterval(progressInterval);
      setVideoProgress(100);

      if (videoErr) throw videoErr;

      const videoStorageUrl = videoPath; // store path, not public URL (private bucket)

      // 3. Insert video record
      const { data: videoData, error: dbErr } = await supabase.from("videos").insert({
        creator_id: user.id,
        title: form.title.trim(),
        short_description: form.short_description.trim() || null,
        full_description: form.full_description.trim() || null,
        genre: form.genre || null,
        age_rating: form.age_rating,
        runtime: form.runtime.trim() || null,
        monetization_type: form.monetization_type,
        price: form.monetization_type === "ppv" && form.price ? Number(form.price) : null,
        thumbnail_url: thumbnailUrl,
        trailer_url: form.trailer_url.trim() || null,
        video_url: videoStorageUrl,
        status: "pending",
        admin_approved: false,
      }).select().single();

      if (dbErr) throw dbErr;

      // 4. Insert tags
      if (form.tags.trim() && videoData) {
        const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          await supabase.from("video_tags").insert(
            tags.map(tag => ({ video_id: videoData.id, tag_name: tag }))
          );
        }
      }

      toast({ title: "Upload successful!", description: "Your content has been submitted for admin review." });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2.5 text-sm bg-surface-raised border border-gold/10 focus:border-gold/40 rounded-sm outline-none text-foreground placeholder:text-muted-foreground transition-colors";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-gold/20 rounded-sm w-full max-w-2xl shadow-elevated max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-gold rounded-sm flex items-center justify-center">
              <Upload className="w-4 h-4 text-background" />
            </div>
            <div>
              <h2 className="cinzel text-base font-bold text-foreground">Upload Content</h2>
              <p className="text-[10px] text-muted-foreground">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-sm text-muted-foreground hover:text-gold hover:bg-surface-raised transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-surface-raised flex-shrink-0">
          <div
            className="h-full gradient-gold transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gold/5 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all ${
                i < step ? "bg-emerald text-foreground" :
                i === step ? "gradient-gold text-background" :
                "bg-surface-raised text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:block text-[10px] text-muted-foreground ml-1.5 truncate">{s}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gold/10 mx-2" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* STEP 0 — Video File */}
          {step === 0 && (
            <div className="space-y-4">
              {/* Video drop zone */}
              <div
                onDrop={handleVideoDrop}
                onDragOver={e => { e.preventDefault(); setVideoDragging(true); }}
                onDragLeave={() => setVideoDragging(false)}
                onClick={() => !videoFile && videoInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-sm p-10 text-center transition-all duration-200 ${
                  videoDragging ? "border-gold bg-gold/5" :
                  videoFile ? "border-emerald/40 bg-emerald/5" :
                  "border-gold/20 hover:border-gold/50 cursor-pointer"
                }`}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f); }}
                />
                {videoFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-10 h-10 text-emerald-bright mx-auto" />
                    <p className="text-sm font-semibold text-foreground">{videoFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(videoFile.size / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                    <button
                      onClick={e => { e.stopPropagation(); setVideoFile(null); }}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Film className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Drag & drop your video file</p>
                      <p className="text-xs text-muted-foreground mt-1">MP4, MOV, MKV, AVI — up to 50 GB</p>
                    </div>
                    <button className="px-4 py-2 border border-gold/30 text-gold text-xs rounded-sm hover:bg-gold hover:text-background transition-all">
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail drop zone */}
              <div
                onDrop={handleThumbDrop}
                onDragOver={e => { e.preventDefault(); setThumbDragging(true); }}
                onDragLeave={() => setThumbDragging(false)}
                onClick={() => thumbInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-sm transition-all duration-200 cursor-pointer ${
                  thumbDragging ? "border-gold bg-gold/5" :
                  thumbnailFile ? "border-gold/40" :
                  "border-gold/15 hover:border-gold/40"
                }`}
              >
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
                {thumbnailPreview ? (
                  <div className="relative group">
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-40 object-cover rounded-sm" />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                      <p className="text-xs text-foreground font-medium">Click to change thumbnail</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-medium text-foreground">Upload Thumbnail</p>
                    <p className="text-[10px] text-muted-foreground">JPG, PNG, WEBP — 16:9 recommended</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-surface-raised rounded-sm px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                <span>All uploaded videos are stored securely. Content goes live only after admin approval.</span>
              </div>
            </div>
          )}

          {/* STEP 1 — Details */}
          {step === 1 && (
            <div className="space-y-3">
              <input
                placeholder="Title *"
                value={form.title}
                onChange={e => set("title", e.target.value)}
                className={inputCls}
                maxLength={120}
              />
              <input
                placeholder="Short description (shown on cards)"
                value={form.short_description}
                onChange={e => set("short_description", e.target.value)}
                className={inputCls}
                maxLength={160}
              />
              <textarea
                placeholder="Full description…"
                value={form.full_description}
                onChange={e => set("full_description", e.target.value)}
                rows={4}
                className={inputCls + " resize-none"}
                maxLength={2000}
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.genre} onChange={e => set("genre", e.target.value)} className={selectCls}>
                  <option value="">Select Genre *</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={form.age_rating} onChange={e => set("age_rating", e.target.value)} className={selectCls}>
                  {AGE_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Runtime (e.g. 1h 45m)"
                  value={form.runtime}
                  onChange={e => set("runtime", e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Release date (YYYY-MM-DD)"
                  value={form.trailer_url}
                  onChange={e => set("trailer_url", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  placeholder="Tags (comma separated: drama, Addis, 2025)"
                  value={form.tags}
                  onChange={e => set("tags", e.target.value)}
                  className={inputCls + " pl-8"}
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Monetization */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">How will this content be monetized?</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: "subscription", label: "Subscription", desc: "Available to all active subscribers at no extra cost." },
                  { value: "ppv", label: "Pay-Per-View", desc: "Viewers pay a one-time fee to unlock this content." },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set("monetization_type", opt.value)}
                    className={`w-full text-left p-4 border rounded-sm transition-all duration-200 ${
                      form.monetization_type === opt.value
                        ? "border-gold bg-gold/5"
                        : "border-gold/10 hover:border-gold/30 bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        form.monetization_type === opt.value ? "border-gold" : "border-muted-foreground"
                      }`}>
                        {form.monetization_type === opt.value && <div className="w-2 h-2 rounded-full bg-gold" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {form.monetization_type === "ppv" && (
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.99"
                    placeholder="Price (USD) *"
                    value={form.price}
                    onChange={e => set("price", e.target.value)}
                    className={inputCls + " pl-8"}
                  />
                </div>
              )}

              <div className="bg-surface-raised border border-gold/10 rounded-sm p-4 space-y-2">
                <p className="text-xs font-semibold text-gold">Revenue Share</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Your earnings</span>
                  <span className="text-emerald-bright font-bold">70%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span className="text-muted-foreground">30%</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Review your submission before publishing.</p>

              {thumbnailPreview && (
                <div className="w-full h-36 rounded-sm overflow-hidden">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="bg-surface-raised border border-gold/10 rounded-sm divide-y divide-gold/5">
                {[
                  { label: "Title", value: form.title },
                  { label: "Genre", value: form.genre },
                  { label: "Age Rating", value: form.age_rating },
                  { label: "Runtime", value: form.runtime || "—" },
                  { label: "Monetization", value: form.monetization_type === "ppv" ? `Pay-Per-View — $${form.price}` : "Subscription" },
                  { label: "Video File", value: videoFile?.name ?? "—" },
                  { label: "Thumbnail", value: thumbnailFile?.name ?? "No thumbnail" },
                  { label: "Tags", value: form.tags || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-surface-raised rounded-sm px-3 py-2.5 border border-gold/10">
                <Clock className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                <span>Your content will be reviewed by our admin team within 24-48 hours. You'll be notified once it's approved or rejected.</span>
              </div>

              {/* Upload progress bars */}
              {submitting && (
                <div className="space-y-2">
                  {thumbnailFile && (
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Thumbnail</span>
                        <span>{thumbProgress}%</span>
                      </div>
                      <div className="h-1 bg-surface-overlay rounded-full overflow-hidden">
                        <div className="h-full gradient-gold transition-all duration-300" style={{ width: `${thumbProgress}%` }} />
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Video Upload</span>
                      <span>{videoProgress}%</span>
                    </div>
                    <div className="h-1 bg-surface-overlay rounded-full overflow-hidden">
                      <div className="h-full gradient-gold transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gold/10 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            disabled={submitting}
            className="px-4 py-2 text-xs border border-gold/20 text-muted-foreground hover:text-foreground hover:border-gold/40 rounded-sm transition-all disabled:opacity-40"
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 px-5 py-2 gradient-gold text-background text-xs font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canAdvance()}
              className="flex items-center gap-2 px-6 py-2 gradient-gold text-background text-xs font-bold rounded-sm hover:opacity-90 transition-all disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {submitting ? "Uploading…" : "Submit for Review"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoUploadModal;

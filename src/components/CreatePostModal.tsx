import React, { useState } from 'react';
import { Category, Post } from '../types';
import { X, Camera, Handshake, Megaphone, AlertTriangle, MapPin, Tag, Sparkles, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    post: Omit<Post, 'id' | 'userId' | 'username' | 'userAvatar' | 'timeElapsed' | 'likes' | 'comments' | 'hasLiked' | 'hasBookmarked'>,
    file?: File
  ) => Promise<void>;
  selectedCityName: string;
}

const PRESET_MOCK_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400&h=300', label: 'Civic / Street' },
  { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400&h=300', label: 'Cafe / Business' },
  { url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=400&h=300', label: 'Sports Court' },
  { url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=400&h=300', label: 'Local Event' }
];

export default function CreatePostModal({ isOpen, onClose, onSubmit, selectedCityName }: CreatePostModalProps) {
  const [category, setCategory] = useState<Category>('locals');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [tag, setTag] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitBtnText, setSubmitBtnText] = useState('Publish Live Post');
  const [policyCopied, setPolicyCopied] = useState(false);

  const STORAGE_POLICY_SQL = `-- Ensure 'post-images' bucket is public
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

-- Allow public read & upload access
create policy "Public Access for Everyone" on storage.objects for select using (bucket_id = 'post-images');
create policy "Allow Public Uploads" on storage.objects for insert with check (bucket_id = 'post-images');
create policy "Allow Public Updates" on storage.objects for update using (bucket_id = 'post-images') with check (bucket_id = 'post-images');
create policy "Allow Public Deletes" on storage.objects for delete using (bucket_id = 'post-images');`;

  const copyStoragePolicySql = () => {
    navigator.clipboard?.writeText?.(STORAGE_POLICY_SQL).catch(() => {});
    setPolicyCopied(true);
    setTimeout(() => setPolicyCopied(false), 2000);
  };

  if (!isOpen) return null;

  const handlePresetSelect = (url: string) => {
    setIsUploading(true);
    setTimeout(() => {
      setImage(url);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      setIsUploading(false);
    }, 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(undefined);
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setValidationError('Please specify a title and descriptive details!');
      return;
    }
    
    setIsSubmitting(true);
    if (selectedFile) {
      setSubmitBtnText('Uploading image...');
    } else {
      setSubmitBtnText('Publishing...');
    }

    try {
      await onSubmit({
        title,
        description,
        category,
        address: address.trim() || 'Nearby',
        tag: tag.trim() || undefined,
        image,
        isPromoted: category === 'promotions'
      }, selectedFile || undefined);

      // Reset state & close
      setTitle('');
      setDescription('');
      setAddress('');
      setTag('');
      setImage(undefined);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      setValidationError('');
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Error occurred while saving!');
    } finally {
      setIsSubmitting(false);
      setSubmitBtnText('Publish Live Post');
    }
  };

  return (
    <div id="modal-wrapper" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        id="create-post-container"
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div id="modal-header" className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <span className="text-md font-bold text-slate-900">Create New Local Post</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {selectedCityName}
            </span>
          </div>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form id="create-post-form" onSubmit={handleFormSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {validationError && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-red-650 bg-red-50 p-3.5 rounded-2xl border border-red-100 leading-relaxed shadow-3xs">
                ⚠️ {validationError}
              </div>
              
              {/* Detailed SQL prompt if it is an RLS policy restriction */}
              {(validationError.toLowerCase().includes('row-level security') || validationError.toLowerCase().includes('policy')) && (
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-left shadow-lg scale-[0.99] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                      💡 Supabase Storage Fix Required!
                    </span>
                    <button
                      type="button"
                      onClick={copyStoragePolicySql}
                      className="bg-white/10 hover:bg-white text-slate-100 hover:text-slate-950 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {policyCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy policy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    By default, new storage buckets block public uploads in Supabase. Paste and run this SQL query in your <strong>Supabase SQL Editor</strong> to grant write permissions on <code>post-images</code> bucket:
                  </p>
                  <pre className="text-[9px] font-mono text-slate-300 bg-slate-950/80 p-3 rounded-xl overflow-x-auto border border-slate-800 leading-normal max-h-40">
                    {STORAGE_POLICY_SQL}
                  </pre>
                  <p className="text-[10px] text-indigo-200">
                    💡 After executing this code, try selecting the file and publishing again!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Level Categorization Selector */}
          <div id="category-filter-group">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-404 block mb-2">
              Select Post Category (Topic Level)
            </label>
            <div className="grid grid-cols-3 gap-2">
              
              <button
                type="button"
                id="select-cat-locals"
                onClick={() => { setCategory('locals'); if(!tag) setTag('Activity'); }}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  category === 'locals'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-850 ring-2 ring-indigo-100/50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Handshake className={`w-5 h-5 ${category === 'locals' ? 'text-indigo-650' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Locals Connect</span>
              </button>

              <button
                type="button"
                id="select-cat-promotions"
                onClick={() => { setCategory('promotions'); if(!tag) setTag('Local Promotion'); }}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  category === 'promotions'
                    ? 'bg-pink-50 border-pink-500 text-pink-850 ring-2 ring-pink-100/50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Megaphone className={`w-5 h-5 ${category === 'promotions' ? 'text-pink-650' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Promotion</span>
              </button>

              <button
                type="button"
                id="select-cat-society"
                onClick={() => { setCategory('society'); if(!tag) setTag('Civic Alert'); }}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  category === 'society'
                    ? 'bg-amber-50 border-amber-500 text-amber-850 ring-2 ring-amber-100/50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${category === 'society' ? 'text-amber-655' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">Society Issue</span>
              </button>

            </div>
          </div>

          {/* Primary Inputs */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-404 block mb-1.5">
              Post Title
            </label>
            <input
              type="text"
              placeholder="e.g., Badminton doubles game, Heavy traffic block, Garage sale..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505 font-semibold"
              maxLength={70}
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-404 block mb-1.5">
              Description / Details
            </label>
            <textarea
              placeholder="What details should the neighborhood know? Add coupons, timing, or helpful details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 text-sm p-4 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505 h-24 resize-none leading-relaxed"
              maxLength={400}
            />
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-404 block mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" /> Specific Location / Area
              </label>
              <input
                type="text"
                placeholder="e.g. Sector 54, Near Park"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-404 block mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-pink-600" /> Label Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Event, Rent, Complaint"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-505 font-medium"
              />
            </div>
          </div>

          {/* Media Select Component */}
          <div id="media-upload-pane" className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-404">Add Photo Proof</span>
              {(image || previewUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setImage(undefined);
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl('');
                    }
                    const input = document.getElementById('post-image-upload') as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Clear Image
                </button>
              )}
            </div>

            {/* Real device upload and preview */}
            {(image || previewUrl) ? (
              <div id="media-preview" className="relative group max-h-48 overflow-hidden rounded-xl border border-slate-205 shadow-inner">
                <img
                  src={image || previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover max-h-48"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-semibold">Image selected ready for upload</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-5">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-[11px] text-slate-500 font-medium font-mono">Preparing asset...</span>
                  </div>
                ) : (
                  <label
                    htmlFor="post-image-upload"
                    className="flex flex-col items-center justify-center p-3 text-center bg-white hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-dashed border-slate-300 group w-full"
                  >
                    <Camera className="w-8 h-8 text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-700">Choose Device Image</span>
                    <span className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP formats (Max 10MB)</span>
                    <input
                      id="post-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Quick Presets Selectors */}
            {!(image || previewUrl) && !isUploading && (
              <div className="mt-3.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-404 mb-1.5 text-center">
                  Or pick a category-matching local photograph
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_MOCK_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePresetSelect(img.url)}
                      className="relative overflow-hidden aspect-4/3 rounded-lg border border-slate-150 hover:scale-95 transition-all text-left group cursor-pointer"
                      title={img.label}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 inset-x-0 text-[7.5px] font-bold text-center text-white bg-slate-950/50 py-0.5 truncate uppercase">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prompt warning & Actions */}
          <div className="pt-2 border-t border-slate-150 flex items-center justify-between">
            <span className="text-[10px] text-slate-404 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Posts automatically expire in 7 days
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {submitBtnText}
              </button>
            </div>
          </div>

        </form>

      </motion.div>
    </div>
  );
}

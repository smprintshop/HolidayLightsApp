import React, { useState, useRef } from 'react';
import { MAX_PHOTOS } from '../constants';
import { generateFestiveDescription } from '../services/geminiService';
import { DisplaySubmission } from '../types';

interface SubmissionFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: DisplaySubmission;
  defaultData?: {
      firstName?: string;
      lastName?: string;
      address?: string;
  }
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onCancel, onSubmit, initialData, defaultData }) => {
  const isEditMode = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [address, setAddress] = useState(initialData?.address || defaultData?.address || '');
  const [firstName, setFirstName] = useState(initialData?.firstName || defaultData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || defaultData?.lastName || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos.map(p => p.url) || []);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width, height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    setIsProcessing(true);
    const newUrls = await Promise.all(files.slice(0, MAX_PHOTOS - photos.length).map(file => optimizeImage(file)));
    setPhotos(prev => [...prev, ...newUrls]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMagicDescription = async () => {
    if (!address) return alert("Enter address first!");
    setIsGenerating(true);
    setDescription(await generateFestiveDescription(address));
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || photos.length === 0) return alert("Required fields missing.");
    setIsProcessing(true);
    try {
        await onSubmit({ address, firstName, lastName, photos, featuredIndex, description });
    } finally {
        setIsProcessing(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-black focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm";

  return (
    <div className="relative p-6 pb-36 max-w-4xl mx-auto bg-white rounded-t-3xl h-full overflow-y-auto scrollbar-hide">
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="festive-font text-2xl text-red-600">Uploading Magic...</h3>
            <p className="text-slate-500 text-sm mt-2">Hang tight, we're stringing the lights across the cloud!</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="festive-font text-3xl text-red-600">{isEditMode ? 'Update' : 'Register'} Display</h2>
        <button onClick={onCancel} className="text-slate-400 p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-700 uppercase mb-2 block">First Name</label><input type="text" className={inputClasses} value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
          <div><label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Last Name</label><input type="text" className={inputClasses} value={lastName} onChange={e => setLastName(e.target.value)} /></div>
        </div>

        <div><label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Address</label><input required type="text" className={inputClasses} value={address} onChange={e => setAddress(e.target.value)} /></div>

        <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Photos ({photos.length}/{MAX_PHOTOS})</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {photos.map((src, i) => (
                <div key={i} onClick={() => setFeaturedIndex(i)} className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer ${featuredIndex === i ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-100'}`}>
                  <img src={src} className="w-full h-full object-cover" />
                  {featuredIndex === i && <div className="absolute bottom-0 inset-x-0 bg-red-600 text-[8px] text-white text-center py-1 font-black">FEATURED</div>}
                  <button type="button" onClick={e => { e.stopPropagation(); setPhotos(p => p.filter((_, idx) => idx !== i)); }} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" /></svg>
                  <span className="text-[10px] font-bold">ADD PHOTO</span>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-slate-700 uppercase">Story</label><button type="button" onClick={handleMagicDescription} disabled={isGenerating} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">{isGenerating ? 'Enchanting...' : '✨ AI Magic Story'}</button></div>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className={`${inputClasses} resize-none`} placeholder="Tell the neighborhood about your theme..." />
        </div>

        <button type="submit" disabled={isProcessing} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-red-700 transform transition-all flex items-center justify-center gap-2">
          <span className="uppercase tracking-widest">{isEditMode ? 'Update' : 'Launch'} Display</span>
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;
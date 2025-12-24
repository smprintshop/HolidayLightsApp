
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
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos.map(p => p.url) || []);

  const featuredPhotoUrl = initialData?.photos.find(p => p.isFeatured)?.url;
  const initialFeaturedIndex = initialData && featuredPhotoUrl ? initialData.photos.map(p => p.url).indexOf(featuredPhotoUrl) : 0;
  const [featuredIndex, setFeaturedIndex] = useState<number>(initialFeaturedIndex);

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
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // High quality but compressed
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Explicitly cast to File[] to fix the 'unknown' assignment error
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    setIsUploading(true);
    const remainingSlots = MAX_PHOTOS - photos.length;
    const filesToProcess = files.slice(0, remainingSlots);

    try {
      const newPhotoPromises = filesToProcess.map(file => optimizeImage(file));
      const newPhotoUrls = await Promise.all(newPhotoPromises);
      setPhotos(prev => [...prev, ...newPhotoUrls]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to process some images.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMagicDescription = async () => {
    if (!address) return alert("Please enter an address first!");
    setIsGenerating(true);
    const desc = await generateFestiveDescription(address);
    setDescription(desc);
    setIsGenerating(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      if (featuredIndex === index) {
        setFeaturedIndex(0);
      } else if (featuredIndex > index) {
        setFeaturedIndex(featuredIndex - 1);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || photos.length === 0) return alert("Address and at least one photo are required.");
    onSubmit({ address, firstName, lastName, photos, featuredIndex, description });
  };

  const inputClasses = "w-full px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 bg-slate-100 text-black placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm";

  return (
    <div className="p-4 md:p-6 pb-36 max-w-4xl mx-auto bg-white rounded-t-3xl shadow-2xl h-full overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex flex-col">
            <h2 className="festive-font text-2xl md:text-3xl text-red-600 leading-none">{isEditMode ? 'Update Your Display' : 'Add Your Display'}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Bluff Park Holiday Spectacular</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5 md:mb-2 uppercase tracking-wide">First Name</label>
              <input
                type="text"
                placeholder="Santa"
                className={inputClasses}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5 md:mb-2 uppercase tracking-wide">Last Name</label>
              <input
                type="text"
                placeholder="Claus"
                className={inputClasses}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1.5 md:mb-2 uppercase tracking-wide">Home Address</label>
            <input
              type="text"
              required
              placeholder="e.g. 123 Pine St, Bluff Park, AL"
              className={inputClasses}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-2">
                <label className="block text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wide">Photos ({photos.length}/{MAX_PHOTOS})</label>
                <span className="text-[10px] text-slate-400 font-medium">Tap photo to set as featured</span>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
            />
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {photos.map((src, i) => (
                <div 
                  key={i} 
                  onClick={() => setFeaturedIndex(i)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${featuredIndex === i ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-100 hover:border-red-200'}`}
                >
                  <img src={src} className="w-full h-full object-cover" alt="Upload" />
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {featuredIndex === i && (
                    <div className="absolute bottom-0 inset-x-0 bg-red-600 text-[8px] text-white text-center py-1 font-black uppercase tracking-tighter">
                      FEATURED
                    </div>
                  )}
                </div>
              ))}
              
              {photos.length < MAX_PHOTOS && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        <span className="text-[10px] font-bold uppercase">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1.5 md:mb-2">
              <label className="block text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wide">Story / Description</label>
              <button 
                type="button" 
                onClick={handleMagicDescription}
                disabled={isGenerating}
                className="text-[10px] font-bold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" /></svg>
                {isGenerating ? 'Enchanting...' : 'AI Magic Story'}
              </button>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your display's theme, inspiration, or how many lights you used!"
              className={`${inputClasses} resize-none h-24`}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isUploading}
          className="w-full bg-red-600 text-white font-bold py-4 md:py-5 rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:grayscale disabled:opacity-50"
        >
          <span className="text-sm md:text-base uppercase tracking-widest">{isEditMode ? 'Update Your Display' : 'Launch Your Display'}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;

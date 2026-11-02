import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Upload,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  Building,
  Navigation,
} from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export const RegisterComplaint = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [locating, setLocating] = useState(false);

  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      departmentId: '',
      description: '',
      address: '',
      latitude: '',
      longitude: '',
    },
  });

  const descriptionValue = watch('description') || '';

  // Fetch active departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        setLoadingDepts(true);
        const res = await api.get('/departments');
        if (res.data?.success) {
          setDepartments(res.data.data);
        }
      } catch (err) {
        addToast('Failed to load active departments', 'error');
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, [addToast]);

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype) && !allowed.includes(file.type)) {
      addToast('Invalid file format. Please upload JPG, PNG, or WEBP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('File exceeds 5MB size limit.', 'error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // GPS auto-locate
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude.toFixed(6));
        setValue('longitude', position.coords.longitude.toFixed(6));
        addToast('Location coordinates captured from device GPS', 'success');
        setLocating(false);
      },
      (error) => {
        addToast('Could not retrieve GPS coordinates. Please enter manually.', 'warning');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (data) => {
    if (!selectedFile) {
      addToast('Please upload a photograph of the complaint issue.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('departmentId', data.departmentId);
      formData.append('description', data.description);
      formData.append('address', data.address);
      if (data.latitude) formData.append('latitude', data.latitude);
      if (data.longitude) formData.append('longitude', data.longitude);

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setSuccessData(res.data.data);
        addToast('Complaint submitted successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (successData?.ticketNo) {
      navigator.clipboard.writeText(successData.ticketNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('Ticket number copied to clipboard', 'info');
    }
  };

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="civic-card p-8 text-center bg-white shadow-xl rounded-2xl border border-emerald-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Grievance Registered Successfully
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your complaint has been submitted to the municipal department queue. You will receive real-time updates as ground verification proceeds.
          </p>

          {/* Prominent Ticket Card */}
          <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 inline-block w-full max-w-md text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Official Ticket Reference Number
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-black text-brand-700 tracking-wider">
                {successData.ticketNo}
              </span>
              <button
                onClick={handleCopyTicket}
                className="civic-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Link
              to={`/citizen/complaints/${successData.complaint._id}`}
              className="civic-btn-primary w-full sm:w-auto"
            >
              View Complaint Details &amp; Timeline
            </Link>
            <button
              onClick={() => {
                setSuccessData(null);
                handleClearFile();
              }}
              className="civic-btn-secondary w-full sm:w-auto"
            >
              Register Another Grievance
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Grievance</h2>
        <p className="text-xs text-slate-500 mt-1">
          Provide complete issue details and photograph for fast departmental routing and ground verification.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo Upload Card */}
        <div className="civic-card p-6">
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Complaint Evidence Photograph <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-4">
            Upload clear photograph showing the defect, road damage, garbage pile, or water leak (JPG, PNG, WEBP, max 5MB).
          </p>

          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-w-md">
              <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
              <button
                type="button"
                onClick={handleClearFile}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/50 hover:bg-brand-50/10 rounded-2xl p-8 text-center cursor-pointer transition-all duration-150"
            >
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Click to upload or drag &amp; drop</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, or WEBP up to 5MB</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
        </div>

        {/* Department & Description Card */}
        <div className="civic-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Municipal Department <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                {...register('departmentId', { required: 'Please select a department' })}
                disabled={loadingDepts}
                className="civic-input pl-9"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.departmentId && (
              <p className="text-xs text-red-600 mt-1">{errors.departmentId.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Detailed Complaint Description <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] ${descriptionValue.length < 10 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                {descriptionValue.length} / 1000 chars (min 10)
              </span>
            </div>
            <textarea
              rows={4}
              {...register('description', {
                required: 'Description is mandatory',
                minLength: { value: 10, message: 'Minimum 10 characters required' },
                maxLength: { value: 1000, message: 'Maximum 1000 characters allowed' },
              })}
              placeholder="Describe the nature of the issue, severity, landmark, and public hazard..."
              className="civic-input"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Location & GPS Card */}
        <div className="civic-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600" />
              Incident Location
            </h3>
            <button
              type="button"
              onClick={handleAutoLocate}
              disabled={locating}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{locating ? 'Detecting GPS...' : 'Auto-detect Coordinates'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Street Address &amp; Landmark <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('address', { required: 'Address is required (at least 3 characters)' })}
              placeholder="e.g. Opposite City Hospital Gate 3, Station Road, Ward 12"
              className="civic-input"
            />
            {errors.address && (
              <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="text"
                {...register('latitude')}
                placeholder="e.g. 18.520430"
                className="civic-input font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="text"
                {...register('longitude')}
                placeholder="e.g. 73.856740"
                className="civic-input font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/citizen/dashboard" className="civic-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="civic-btn-primary px-6"
          >
            {submitting ? 'Submitting Grievance...' : 'Submit Grievance'}
          </button>
        </div>
      </form>
    </div>
  );
};

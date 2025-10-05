"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocketContext } from '@/context/SocketProvider';
import KidsButton from '@/components/kids/KidsButton';
import KidsCard from '@/components/kids/KidsCard';

interface PatientFormData {
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_relationship: string;
  medical_history: string;
  special_needs: string;
  preferred_language: string;
}

interface PatientFormProps {
  initialData?: Partial<PatientFormData>;
  isEditing?: boolean;
  onSubmit?: (data: PatientFormData) => void;
  onCancel?: () => void;
}

export default function PatientForm({ 
  initialData, 
  isEditing = false, 
  onSubmit,
  onCancel 
}: PatientFormProps) {
  const { user, isKidsMode } = useSocketContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PatientFormData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    middle_name: initialData?.middle_name || '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    guardian_name: initialData?.guardian_name || '',
    guardian_phone: initialData?.guardian_phone || '',
    guardian_relationship: initialData?.guardian_relationship || 'Parent',
    medical_history: initialData?.medical_history || '',
    special_needs: initialData?.special_needs || '',
    preferred_language: initialData?.preferred_language || 'Filipino'
  });

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    // Validate age (must be reasonable)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 0 || age > 120) {
        newErrors.date_of_birth = 'Please enter a valid date of birth';
      }
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmit) {
        onSubmit(formData);
      } else {
        // Default API call
        const response = await fetch('/api/patients', {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            assigned_clinician_id: user?.clinician_id
          })
        });

        if (response.ok) {
          router.push('/patients');
        } else {
          const errorData = await response.json();
          setErrors({ submit: errorData.error || 'Failed to save patient' });
        }
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      setErrors({ submit: 'An error occurred while saving' });
    } finally {
      setIsLoading(false);
    }
  };

  const FormField = ({ 
    label, 
    field, 
    type = 'text', 
    required = false,
    options,
    textarea = false 
  }: {
    label: string;
    field: keyof PatientFormData;
    type?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    textarea?: boolean;
  }) => (
    <div className="mb-4">
      <label className={`block font-medium mb-2 ${isKidsMode ? 'text-lg text-purple-700' : 'text-sm text-gray-700'}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {options ? (
        <select
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors[field] ? 'border-red-500' : 'border-gray-300'
          } ${isKidsMode ? 'text-lg rounded-2xl' : ''}`}
        >
          <option value="">Select {label}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
            errors[field] ? 'border-red-500' : 'border-gray-300'
          } ${isKidsMode ? 'text-lg rounded-2xl' : ''}`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <input
          type={type}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors[field] ? 'border-red-500' : 'border-gray-300'
          } ${isKidsMode ? 'text-lg rounded-2xl' : ''}`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
      
      {errors[field] && (
        <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
      )}
    </div>
  );

  if (isKidsMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <KidsCard title={`${isEditing ? 'Baguhin' : 'Bagong'} Pasyente 👶`} colorScheme="blue">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Pangalan" field="first_name" required />
              <FormField label="Apelyido" field="last_name" required />
            </div>
            
            <FormField label="Middle Name" field="middle_name" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Kapanganakan" field="date_of_birth" type="date" required />
              <FormField 
                label="Kasarian" 
                field="gender" 
                options={[
                  { value: 'Male', label: 'Lalaki' },
                  { value: 'Female', label: 'Babae' },
                  { value: 'Other', label: 'Iba pa' }
                ]}
              />
            </div>

            {errors.submit && (
              <div className="text-center text-red-600 font-semibold text-lg">
                {errors.submit}
              </div>
            )}

            <div className="flex justify-center gap-6">
              <KidsButton 
                type="button" 
                variant="secondary" 
                size="lg"
                onClick={onCancel || (() => router.back())}
                disabled={isLoading}
                icon="❌"
              >
                Kanselahin
              </KidsButton>
              
              <KidsButton 
                type="submit" 
                variant="primary" 
                size="lg"
                disabled={isLoading}
                icon="💾"
              >
                {isLoading ? 'Sinasave...' : (isEditing ? 'I-update' : 'I-save')}
              </KidsButton>
            </div>
          </form>
        </KidsCard>
      </div>
    );
  }

  // Standard mode form
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Patient' : 'New Patient'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="First Name" field="first_name" required />
            <FormField label="Last Name" field="last_name" required />
            <FormField label="Middle Name" field="middle_name" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField label="Date of Birth" field="date_of_birth" type="date" required />
            <FormField 
              label="Gender" 
              field="gender" 
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Phone" field="phone" type="tel" />
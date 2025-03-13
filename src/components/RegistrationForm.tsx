'use client';

import { useState } from 'react';

interface FormData {
  name: string;
  phone: string;
  email: string;
  gender: string;
  college: string;
  status: string;
  nationalId: string;
}

interface RegistrationFormProps {
  companyName: string;
  eventName: string;
}

export default function RegistrationForm({ companyName, eventName }: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    college: '',
    status: 'student',
    nationalId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (
      !formData.name ||
      !formData.phone ||
      !formData.email ||
      !formData.gender ||
      !formData.college ||
      !formData.status ||
      !formData.nationalId
    ) {
      setError('All fields are required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return;
    }
    
    // Validate phone number (Egyptian format)
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Invalid phone number format (e.g., 01xxxxxxxxx)');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          eventName,
          ...formData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register for event');
      }
      
      // Show success message
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'male',
        college: '',
        status: 'student',
        nationalId: '',
      });
    } catch (error) {
      console.error('Error registering for event:', error);
      setError(error instanceof Error ? error.message : 'Failed to register for event');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Registration Successful!</p>
          <p>Thank you for registering for this event.</p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Register Another Person
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.name}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </div>
        
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.phone}
            onChange={handleChange}
            disabled={submitting}
            placeholder="01xxxxxxxxx"
            required
          />
        </div>
        
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.email}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </div>
        
        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.gender}
            onChange={handleChange}
            disabled={submitting}
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        
        <div>
          <label
            htmlFor="college"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            College
          </label>
          <input
            type="text"
            id="college"
            name="college"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.college}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </div>
        
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.status}
            onChange={handleChange}
            disabled={submitting}
            required
          >
            <option value="student">Student</option>
            <option value="graduate">Graduate</option>
          </select>
        </div>
        
        <div>
          <label
            htmlFor="nationalId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            National ID
          </label>
          <input
            type="text"
            id="nationalId"
            name="nationalId"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.nationalId}
            onChange={handleChange}
            disabled={submitting}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Your National ID will only be visible to administrators.
          </p>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <button
          type="submit"
          className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Register for Event'}
        </button>
      </div>
    </form>
  );
} 
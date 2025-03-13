'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import RegistrationForm from '@/components/RegistrationForm';

interface FormData {
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  college: string;
  status: 'student' | 'graduate';
  nationalId: string;
}

interface Event {
  id: string;
  name: string;
  image: string | null;
  registrations: number;
  enabled: boolean;
}

export default function EventPage() {
  const params = useParams();
  const companyName = params.company_name as string;
  const eventId = params.event_id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<{
    id: string;
    name: string;
    date: string;
    location: string;
    image: string | null;
    enabled: boolean;
  } | null>(null);
  const [company, setCompany] = useState<{
    name: string;
    image: string | null;
    enabled: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        // Fetch company details first
        const companyResponse = await fetch(`/api/companies?name=${companyName}`);
        if (!companyResponse.ok) {
          throw new Error('Company not found');
        }
        const companyData = await companyResponse.json();
        setCompany(companyData);
        
        // Check if company is enabled
        if (!companyData.enabled) {
          setError('This company is currently not accepting registrations');
          setLoading(false);
          return;
        }

        // Fetch event details
        const eventResponse = await fetch(`/api/events?id=${eventId}&companyName=${companyName}`);
        if (!eventResponse.ok) {
          throw new Error('Event not found');
        }
        const eventData = await eventResponse.json();
        setEvent(eventData);
        
        // Check if event is enabled
        if (!eventData.enabled) {
          setError('This event is currently not accepting registrations');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Event not found');
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [companyName, eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <p className="text-gray-600 mb-6">
            Please check back later or contact the event organizer for more information.
          </p>
          <Link href="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!event || !company) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {company.image ? (
              <div className="h-16 w-16 mr-4 relative">
                <Image
                  src={company.image}
                  alt={company.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 mr-4 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-xl">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex items-center">
            {event.image ? (
              <div className="h-24 w-24 mr-4 relative">
                <Image
                  src={event.image}
                  alt={event.name}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="h-24 w-24 mr-4 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-2xl">
                  {event.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {new Date(event.date).toLocaleDateString()} at {event.location}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(event.date).toLocaleDateString()}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {event.location}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {event.enabled ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Registration Form
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Please fill out the form below to register for this event.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <RegistrationForm companyName={companyName} eventName={event.name} />
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Registration for this event is currently closed. Please check back later or contact the event organizer.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 
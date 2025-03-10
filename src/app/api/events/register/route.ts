import { NextRequest, NextResponse } from 'next/server';
import { getTableData, addToTable } from '@/lib/sheets';

// POST /api/events/register - Register for an event
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const {
      companyName,
      eventName,
      name,
      phone,
      email,
      gender,
      college,
      status,
      nationalId,
    } = await request.json();
    
    // Validate required fields
    if (!companyName || !eventName || !name || !phone || !email || !gender || !college || !status || !nationalId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate phone number (simple validation)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    
    // Check if the event exists
    try {
      await getTableData(companyName, eventName);
    } catch {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if the person is already registered (by email or phone)
    try {
      const registrations = await getTableData(companyName, eventName);
      
      // Skip header row
      const registrationData = registrations.slice(1);
      
      // Find registration with matching email or phone
      const existingRegistration = registrationData.find(
        (row) => row[2] === email || row[1] === phone
      );
      
      if (existingRegistration) {
        return NextResponse.json(
          { error: 'You are already registered for this event' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing registrations:', error);
      // Continue with registration
    }
    
    // Add registration to the event table
    const registrationDate = new Date().toISOString();
    
    await addToTable(companyName, eventName, [
      name,
      phone,
      email,
      gender,
      college,
      status,
      nationalId,
      registrationDate,
      '', // No image for registrations
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      registration: {
        name,
        email,
        registrationDate,
      },
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendToSheet, createSheet } from '@/lib/sheets';
import { getEventRegistrationsSheet } from '@/lib/utils';

// POST /api/events/register - Register for an event
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      companyName: rawCompanyName,
      eventName,
      name,
      phone,
      email,
      gender,
      college,
      status,
      nationalId,
    } = body;
    
    // Ensure company name is properly decoded
    const companyName = decodeURIComponent(rawCompanyName);
    
    console.log('Registration request received:', {
      companyName,
      eventName,
      name,
      email,
    });
    
    // Validate required fields
    if (!companyName || !eventName || !name || !phone || !email || !gender || !college || !status || !nationalId) {
      console.log('Validation failed - missing fields:', {
        companyName: !!companyName,
        eventName: !!eventName,
        name: !!name,
        phone: !!phone,
        email: !!email,
        gender: !!gender,
        college: !!college,
        status: !!status,
        nationalId: !!nationalId,
      });
      
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
    
    // Validate phone number format (Egyptian format)
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    
    // Get company data
    const companiesData = await getSheetData(process.env.COMPANIES_SHEET_ID || '');
    const headers = companiesData[0];
    const nameIndex = headers.indexOf('Name');
    const sheetIdIndex = headers.indexOf('SheetId');
    const enabledIndex = headers.indexOf('Enabled');
    
    let companySheetId = '';
    let companyEnabled = true;
    
    for (let i = 1; i < companiesData.length; i++) {
      if (companiesData[i][nameIndex] === companyName) {
        companySheetId = companiesData[i][sheetIdIndex];
        companyEnabled = companiesData[i][enabledIndex] === 'TRUE';
        break;
      }
    }
    
    if (!companySheetId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    // Check if company is enabled
    if (!companyEnabled) {
      return NextResponse.json({ error: 'This company is currently not accepting registrations' }, { status: 403 });
    }
    
    // Get event data
    const eventsData = await getSheetData(companySheetId);
    const eventHeaders = eventsData[0];
    const eventNameIndex = eventHeaders.indexOf('Name');
    const eventIdIndex = eventHeaders.indexOf('ID');
    const eventEnabledIndex = eventHeaders.indexOf('Enabled');
    
    let eventId = '';
    let eventEnabled = true;
    
    for (let i = 1; i < eventsData.length; i++) {
      if (eventsData[i][eventNameIndex] === eventName) {
        eventId = eventsData[i][eventIdIndex];
        eventEnabled = eventsData[i][eventEnabledIndex] === 'TRUE';
        break;
      }
    }
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if event is enabled
    if (!eventEnabled) {
      return NextResponse.json({ error: 'This event is currently not accepting registrations' }, { status: 403 });
    }
    
    // Check if user is already registered
    const registrationsSheetName = getEventRegistrationsSheet(eventId);
    let registrationsData;
    
    try {
      registrationsData = await getSheetData(companySheetId, registrationsSheetName);
    } catch (error) {
      // Sheet might not exist yet, create it
      await createSheet(companySheetId, registrationsSheetName, [
        'Name', 'Email', 'Phone', 'Gender', 'College', 'Status', 'National ID', 'Timestamp'
      ]);
      registrationsData = [['Name', 'Email', 'Phone', 'Gender', 'College', 'Status', 'National ID', 'Timestamp']];
    }
    
    if (registrationsData && registrationsData.length > 1) {
      const emailIndex = registrationsData[0].indexOf('Email');
      const phoneIndex = registrationsData[0].indexOf('Phone');
      const nationalIdIndex = registrationsData[0].indexOf('National ID');
      
      for (let i = 1; i < registrationsData.length; i++) {
        if (
          registrationsData[i][emailIndex] === email ||
          registrationsData[i][phoneIndex] === phone ||
          registrationsData[i][nationalIdIndex] === nationalId
        ) {
          return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 });
        }
      }
    }
    
    // Add registration to the event registrations sheet
    const timestamp = new Date().toISOString();
    await appendToSheet(
      companySheetId,
      registrationsSheetName,
      [[name, email, phone, gender, college, status, nationalId, timestamp]]
    );
    
    return NextResponse.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSheetData } from '@/lib/sheets';
import { getEventRegistrationsSheet } from '@/lib/utils';

// GET /api/events/registrations?eventId={eventId}&companyName={companyName} - Get registrations for an event
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');
    const companyName = searchParams.get('companyName');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // If user is company, they can only access their own events
    if (session.user.type === 'company' && (!companyName || session.user.name !== companyName)) {
      return NextResponse.json({ error: 'Unauthorized to access this event' }, { status: 403 });
    }

    // Get company name if not provided (for admin users)
    let company = companyName;
    if (!company && session.user.type === 'admin') {
      // Find the company for this event
      const companiesData = await getSheetData(process.env.COMPANIES_SHEET_ID || '');
      const headers = companiesData[0];
      const nameIndex = headers.indexOf('Name');
      
      for (let i = 1; i < companiesData.length; i++) {
        const companyRow = companiesData[i];
        const eventsSheetId = companyRow[headers.indexOf('SheetId')];
        
        if (eventsSheetId) {
          const eventsData = await getSheetData(eventsSheetId);
          const eventHeaders = eventsData[0];
          const eventIdIndex = eventHeaders.indexOf('ID');
          
          for (let j = 1; j < eventsData.length; j++) {
            const eventRow = eventsData[j];
            if (eventRow[eventIdIndex] === eventId) {
              company = companyRow[nameIndex];
              break;
            }
          }
          
          if (company) break;
        }
      }
      
      if (!company) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
    }

    // Get registrations
    const registrationsSheetName = getEventRegistrationsSheet(eventId);
    const companiesData = await getSheetData(process.env.COMPANIES_SHEET_ID || '');
    const headers = companiesData[0];
    const nameIndex = headers.indexOf('Name');
    const sheetIdIndex = headers.indexOf('SheetId');
    
    let companySheetId = '';
    for (let i = 1; i < companiesData.length; i++) {
      if (companiesData[i][nameIndex] === company) {
        companySheetId = companiesData[i][sheetIdIndex];
        break;
      }
    }
    
    if (!companySheetId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    const registrationsData = await getSheetData(companySheetId, registrationsSheetName);
    if (!registrationsData || registrationsData.length <= 1) {
      return NextResponse.json([]);
    }
    
    const registrationHeaders = registrationsData[0];
    const registrations = registrationsData.slice(1).map((row, index) => {
      const registration: any = { id: index.toString() };
      
      registrationHeaders.forEach((header: string, i: number) => {
        if (header) {
          const key = header.toLowerCase().replace(/\s+/g, '');
          registration[key] = row[i] || '';
        }
      });
      
      return registration;
    });
    
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
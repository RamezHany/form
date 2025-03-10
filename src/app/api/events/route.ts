import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, createTable, getTableData, deleteTable } from '@/lib/sheets';
import { uploadImage } from '@/lib/github';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events?company={companyName} - Get all events for a company
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get company name from query parameters
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('company');
    
    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }
    
    // Check if user is admin or the company owner
    if (session.user.type !== 'admin' && session.user.name !== companyName) {
      return NextResponse.json(
        { error: 'Unauthorized to access this company\'s events' },
        { status: 403 }
      );
    }
    
    // Get company sheet data
    const data = await getSheetData(companyName);
    
    // Find all tables (events) in the sheet
    const events = [];
    for (let i = 0; i < data.length; i++) {
      // If a row has only one cell and it's not empty, it's likely a table name (event)
      if (data[i].length === 1 && data[i][0] && !data[i][0].startsWith('ID')) {
        const eventName = data[i][0];
        
        // Get the next row for headers
        const headers = data[i + 1] || [];
        
        // Find the image URL if it exists in the headers
        const imageIndex = headers.findIndex(h => h === 'Image');
        let imageUrl = null;
        
        if (imageIndex !== -1 && data[i + 2] && data[i + 2][imageIndex]) {
          imageUrl = data[i + 2][imageIndex];
        }
        
        events.push({
          id: eventName,
          name: eventName,
          image: imageUrl,
          registrations: 0, // We'll calculate this later
        });
      }
    }
    
    // Calculate registrations for each event
    for (const event of events) {
      try {
        const eventData = await getTableData(companyName, event.id);
        // Subtract 1 for the header row
        event.registrations = Math.max(0, eventData.length - 1);
      } catch (error) {
        console.error(`Error getting data for event ${event.id}:`, error);
        // Continue with the next event
      }
    }
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error getting events:', error);
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { companyName, eventName, image } = await request.json();
    
    // Validate required fields
    if (!companyName || !eventName) {
      return NextResponse.json(
        { error: 'Company name and event name are required' },
        { status: 400 }
      );
    }
    
    // Check if user is admin or the company owner
    if (session.user.type !== 'admin' && session.user.name !== companyName) {
      return NextResponse.json(
        { error: 'Unauthorized to create events for this company' },
        { status: 403 }
      );
    }
    
    // Upload image if provided
    let imageUrl = null;
    if (image) {
      const fileName = `event_${companyName}_${eventName}_${Date.now()}.jpg`;
      const uploadResult = await uploadImage(fileName, image, 'events');
      
      if (uploadResult.success) {
        imageUrl = uploadResult.url;
      }
    }
    
    // Define headers for the event table
    const headers = [
      'Name',
      'Phone',
      'Email',
      'Gender',
      'College',
      'Status', // Student or Graduate
      'National ID',
      'Registration Date',
      'Image', // For the event banner
    ];
    
    // Create the event table in the company sheet
    await createTable(companyName, eventName, headers);
    
    // If image was uploaded, add it as the first row in the table
    if (imageUrl) {
      // We'll use the addToTable function from sheets.ts
      // But for now, we'll just return the event data
    }
    
    return NextResponse.json({
      success: true,
      event: {
        id: eventName,
        name: eventName,
        image: imageUrl,
        registrationUrl: `${process.env.NEXTAUTH_URL}/${companyName}/${eventName}`,
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events?company={companyName}&event={eventName} - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('company');
    const eventName = searchParams.get('event');
    
    if (!companyName || !eventName) {
      return NextResponse.json(
        { error: 'Company name and event name are required' },
        { status: 400 }
      );
    }
    
    // Check if user is admin or the company owner
    if (session.user.type !== 'admin' && session.user.name !== companyName) {
      return NextResponse.json(
        { error: 'Unauthorized to delete events for this company' },
        { status: 403 }
      );
    }
    
    // Delete the event table
    await deleteTable(companyName, eventName);
    
    return NextResponse.json({
      success: true,
      message: `Event ${eventName} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, addToTable } from '@/lib/sheets';

// POST /api/register - Register for an event
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { companyName, eventName, name, email } = await request.json();
    
    console.log('Registration request received:', {
      companyName,
      eventName,
      name,
      email,
    });
    
    // Validate required fields
    if (!companyName || !eventName || !name || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if company exists
    console.log('Checking if company exists:', companyName);
    try {
      await getSheetData(companyName);
    } catch {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Check if company is enabled
    const companiesData = await getSheetData('companies');
    const headers = companiesData[0];
    const statusColumnIndex = headers.findIndex(header => 
      header === 'Status' || header === 'Enabled' || header === 'enabled'
    );
    
    const companyIndex = companiesData.slice(1).findIndex(row => row[1] === companyName);
    
    if (companyIndex !== -1) {
      const companyRow = companiesData[companyIndex + 1];
      
      if (statusColumnIndex !== -1) {
        const statusValue = companyRow[statusColumnIndex];
        const isEnabled = statusValue === 'true' || statusValue === 'enabled';
        
        if (!isEnabled) {
          return NextResponse.json(
            { error: 'This company is currently disabled and not accepting registrations' },
            { status: 403 }
          );
        }
      }
    }
    
    // Check if event exists and is enabled
    console.log('Checking if event exists:', { companyName, eventName });
    const data = await getSheetData(companyName);
    
    // Find the event table
    let tableStartRow = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === eventName) {
        tableStartRow = i;
        break;
      }
    }
    
    if (tableStartRow === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if event is enabled
    const eventHeaders = data[tableStartRow];
    const eventStatusColumnIndex = eventHeaders.findIndex(header => 
      header === 'Status' || header === 'Enabled' || header === 'enabled'
    );
    
    if (eventStatusColumnIndex !== -1) {
      const eventDataRow = data[tableStartRow + 1] || [];
      const statusValue = eventDataRow[eventStatusColumnIndex];
      const isEnabled = statusValue === 'true' || statusValue === 'enabled';
      
      if (!isEnabled) {
        return NextResponse.json(
          { error: 'This event is currently disabled and not accepting registrations' },
          { status: 403 }
        );
      }
    }
    
    // Add registration to the event table
    console.log('Adding registration to table:', {
      companyName,
      eventName,
      name,
      email,
    });
    
    // Find the end of the table
    let tableEndRow = tableStartRow + 1;
    while (
      tableEndRow < data.length &&
      data[tableEndRow] &&
      data[tableEndRow].some((cell) => cell)
    ) {
      tableEndRow++;
    }
    
    // Add registration
    await addToTable(companyName, eventName, [name, email]);
    
    console.log('Registration successful');
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, createTable, deleteTable, updateTableData } from '@/lib/sheets';
import { uploadImage } from '@/lib/github';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events - Get all events or events for a specific company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('company');
    
    if (companyName) {
      console.log(`Getting events for company: ${companyName}`);
      
      // Get data from the company's sheet
      const data = await getSheetData(companyName);
      
      // Find all tables in the sheet
      const events = [];
      let currentTable = null;
      let tableStartRow = -1;
      let tableEndRow = -1;
      
      // Get headers and find the index of the "الحالة" column for events
      const headers = data[0] || [];
      const statusColumnIndex = headers.findIndex(header => 
        header === 'الحالة' || header === 'Enabled' || header === 'enabled'
      );
      
      console.log('Event headers:', headers);
      console.log('Event status column index:', statusColumnIndex);
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Check if this is a table header row
        if (row[0] && !row[0].startsWith('Registration')) {
          // If we were processing a table, add it to the events
          if (currentTable) {
            // Count registrations (rows between tableStartRow + 1 and tableEndRow)
            const registrations = Math.max(0, tableEndRow - tableStartRow);
            
            // Find image URL if it exists
            const imageColumnIndex = data[tableStartRow].findIndex(
              (cell) => cell === 'Image' || cell === 'image' || cell === 'الصورة'
            );
            
            let imageUrl = null;
            if (imageColumnIndex !== -1 && data[tableStartRow + 1][imageColumnIndex]) {
              imageUrl = data[tableStartRow + 1][imageColumnIndex];
            }
            
            // Find enabled status if it exists
            let isEnabled = true; // Default to enabled
            if (statusColumnIndex !== -1 && data[tableStartRow + 1][statusColumnIndex] !== undefined) {
              const statusValue = data[tableStartRow + 1][statusColumnIndex];
              isEnabled = statusValue === 'true' || statusValue === 'مفعل';
            }
            
            events.push({
              id: currentTable,
              name: currentTable,
              registrations,
              image: imageUrl,
              enabled: isEnabled
            });
          }
          
          // Start a new table
          currentTable = row[0];
          tableStartRow = i;
          tableEndRow = i + 1; // At least include the header row
        } else if (currentTable && row.some((cell) => cell)) {
          // This is a data row for the current table
          tableEndRow = i + 1;
        }
      }
      
      // Add the last table if there was one
      if (currentTable) {
        // Count registrations (rows between tableStartRow + 1 and tableEndRow)
        const registrations = Math.max(0, tableEndRow - tableStartRow - 1);
        
        // Find image URL if it exists
        const imageColumnIndex = data[tableStartRow].findIndex(
          (cell) => cell === 'Image' || cell === 'image' || cell === 'الصورة'
        );
        
        let imageUrl = null;
        if (imageColumnIndex !== -1 && data[tableStartRow + 1][imageColumnIndex]) {
          imageUrl = data[tableStartRow + 1][imageColumnIndex];
        }
        
        // Find enabled status if it exists
        let isEnabled = true; // Default to enabled
        if (statusColumnIndex !== -1 && data[tableStartRow + 1][statusColumnIndex] !== undefined) {
          const statusValue = data[tableStartRow + 1][statusColumnIndex];
          isEnabled = statusValue === 'true' || statusValue === 'مفعل';
        }
        
        events.push({
          id: currentTable,
          name: currentTable,
          registrations,
          image: imageUrl,
          enabled: isEnabled
        });
      }
      
      return NextResponse.json({ events });
    } else {
      // Get all companies
      const companiesData = await getSheetData('companies');
      const companies = companiesData.slice(1).map((row) => row[1]); // Get company names
      
      // Get events for each company
      const allEvents = [];
      
      for (const company of companies) {
        try {
          const companyData = await getSheetData(company);
          
          // Find all tables in the sheet
          let currentTable = null;
          let tableStartRow = -1;
          let tableEndRow = -1;
          
          // Get headers and find the index of the "الحالة" column for events
          const headers = companyData[0] || [];
          const statusColumnIndex = headers.findIndex(header => 
            header === 'الحالة' || header === 'Enabled' || header === 'enabled'
          );
          
          for (let i = 0; i < companyData.length; i++) {
            const row = companyData[i];
            
            // Check if this is a table header row
            if (row[0] && !row[0].startsWith('Registration')) {
              // If we were processing a table, add it to the events
              if (currentTable) {
                // Count registrations (rows between tableStartRow + 1 and tableEndRow)
                const registrations = Math.max(0, tableEndRow - tableStartRow - 1);
                
                // Find image URL if it exists
                const imageColumnIndex = companyData[tableStartRow].findIndex(
                  (cell) => cell === 'Image' || cell === 'image' || cell === 'الصورة'
                );
                
                let imageUrl = null;
                if (
                  imageColumnIndex !== -1 &&
                  companyData[tableStartRow + 1][imageColumnIndex]
                ) {
                  imageUrl = companyData[tableStartRow + 1][imageColumnIndex];
                }
                
                // Find enabled status if it exists
                let isEnabled = true; // Default to enabled
                if (statusColumnIndex !== -1 && companyData[tableStartRow + 1][statusColumnIndex] !== undefined) {
                  const statusValue = companyData[tableStartRow + 1][statusColumnIndex];
                  isEnabled = statusValue === 'true' || statusValue === 'مفعل';
                }
                
                allEvents.push({
                  id: currentTable,
                  name: currentTable,
                  company,
                  registrations,
                  image: imageUrl,
                  enabled: isEnabled
                });
              }
              
              // Start a new table
              currentTable = row[0];
              tableStartRow = i;
              tableEndRow = i + 1; // At least include the header row
            } else if (currentTable && row.some((cell) => cell)) {
              // This is a data row for the current table
              tableEndRow = i + 1;
            }
          }
          
          // Add the last table if there was one
          if (currentTable) {
            // Count registrations (rows between tableStartRow + 1 and tableEndRow)
            const registrations = Math.max(0, tableEndRow - tableStartRow - 1);
            
            // Find image URL if it exists
            const imageColumnIndex = companyData[tableStartRow].findIndex(
              (cell) => cell === 'Image' || cell === 'image' || cell === 'الصورة'
            );
            
            let imageUrl = null;
            if (
              imageColumnIndex !== -1 &&
              companyData[tableStartRow + 1][imageColumnIndex]
            ) {
              imageUrl = companyData[tableStartRow + 1][imageColumnIndex];
            }
            
            // Find enabled status if it exists
            let isEnabled = true; // Default to enabled
            if (statusColumnIndex !== -1 && companyData[tableStartRow + 1][statusColumnIndex] !== undefined) {
              const statusValue = companyData[tableStartRow + 1][statusColumnIndex];
              isEnabled = statusValue === 'true' || statusValue === 'مفعل';
            }
            
            allEvents.push({
              id: currentTable,
              name: currentTable,
              company,
              registrations,
              image: imageUrl,
              enabled: isEnabled
            });
          }
        } catch (error) {
          console.error(`Error getting events for company ${company}:`, error);
          // Continue with other companies
        }
      }
      
      return NextResponse.json({ events: allEvents });
    }
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
      'Enabled', // New field for event status
    ];
    
    // Create the event table in the company sheet
    await createTable(companyName, eventName, headers);
    
    // If image was uploaded, add it as the first row in the table
    // Also set the event as enabled by default
    const firstRow = Array(headers.length).fill('');
    firstRow[headers.indexOf('Image')] = imageUrl || '';
    firstRow[headers.indexOf('Enabled')] = 'true'; // Enable by default
    
    // Add the first row with image and enabled status
    await updateTableData(companyName, eventName, 1, firstRow);
    
    return NextResponse.json({
      success: true,
      event: {
        id: eventName,
        name: eventName,
        image: imageUrl,
        enabled: true,
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

// PATCH /api/events - Update event details
export async function PATCH(request: NextRequest) {
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
    const { companyName, eventName, image, enabled } = await request.json();
    
    // Validate required fields
    if (!companyName || !eventName) {
      return NextResponse.json(
        { error: 'Company name and event name are required' },
        { status: 400 }
      );
    }
    
    // Check if user is authorized (admin or the company owner)
    if (
      session.user.type !== 'admin' &&
      session.user.type !== 'company' &&
      session.user.name !== companyName
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to update this event' },
        { status: 403 }
      );
    }
    
    // Get data from the company's sheet
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
    
    // Get the headers row
    const headers = data[tableStartRow];
    
    // Find or add the image column
    let imageColumnIndex = headers.findIndex(
      (cell) => cell === 'Image' || cell === 'image' || cell === 'الصورة'
    );
    
    if (imageColumnIndex === -1 && image) {
      // Add Image column if it doesn't exist
      headers.push('الصورة');
      imageColumnIndex = headers.length - 1;
      
      // Update the headers row
      await updateTableData(companyName, eventName, 0, headers);
    }
    
    // Find or add the status column
    let statusColumnIndex = headers.findIndex(
      (cell) => cell === 'الحالة' || cell === 'Enabled' || cell === 'enabled'
    );
    
    if (statusColumnIndex === -1 && enabled !== undefined) {
      // Add Status column if it doesn't exist
      headers.push('الحالة');
      statusColumnIndex = headers.length - 1;
      
      // Update the headers row
      await updateTableData(companyName, eventName, 0, headers);
    }
    
    // Get the data row (first row after headers)
    const dataRow = data[tableStartRow + 1] || [];
    const updatedDataRow = [...dataRow];
    
    // Update image if provided
    if (image && imageColumnIndex !== -1) {
      // Upload image to GitHub
      const fileName = `event_${companyName}_${eventName}_${Date.now()}.jpg`;
      const uploadResult = await uploadImage(fileName, image, 'events');
      
      if (uploadResult.success) {
        // Ensure the data row is long enough
        while (updatedDataRow.length <= imageColumnIndex) {
          updatedDataRow.push('');
        }
        
        updatedDataRow[imageColumnIndex] = uploadResult.url;
      }
    }
    
    // Update enabled status if provided
    if (enabled !== undefined && statusColumnIndex !== -1) {
      // Ensure the data row is long enough
      while (updatedDataRow.length <= statusColumnIndex) {
        updatedDataRow.push('');
      }
      
      // Convert boolean to appropriate string value
      updatedDataRow[statusColumnIndex] = enabled ? 'مفعل' : 'معطل';
    }
    
    // Update the data row
    await updateTableData(companyName, eventName, 1, updatedDataRow);
    
    return NextResponse.json({
      success: true,
      event: {
        id: eventName,
        name: eventName,
        company: companyName,
        image: imageColumnIndex !== -1 ? updatedDataRow[imageColumnIndex] : null,
        enabled: statusColumnIndex !== -1 ? 
          (updatedDataRow[statusColumnIndex] === 'مفعل' || updatedDataRow[statusColumnIndex] === 'true') : 
          true
      },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
} 
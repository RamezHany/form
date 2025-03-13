import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendToSheet, createSheet, deleteRow } from '@/lib/sheets';
import { uploadImage } from '@/lib/github';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/companies - Get all companies
export async function GET(request: NextRequest) {
  try {
    // Check if we're looking for a specific company
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get companies data
    const data = await getSheetData('companies');
    
    // Skip header row
    const companiesData = data.slice(1);
    
    // Map to company objects
    const companies = companiesData.map((row) => ({
      id: row[0],
      name: row[1],
      username: row[2],
      image: row[4],
      enabled: row[5] === 'true', // Add enabled field
    }));
    
    // If id is provided, return only that company
    if (id) {
      const company = companies.find(c => c.id === id);
      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      return NextResponse.json(company);
    }
    
    // If name is provided, return only that company
    if (name) {
      const company = companies.find(c => c.name === name);
      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      return NextResponse.json(company);
    }
    
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error getting companies:', error);
    return NextResponse.json(
      { error: 'Failed to get companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated as admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { name, username, password, image } = await request.json();
    
    // Validate required fields
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Name, username, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if companies sheet exists, if not create it
    try {
      await getSheetData('companies');
    } catch {
      console.log('Companies sheet does not exist, creating it...');
      // Create companies sheet with headers
      await createSheet('companies');
      await appendToSheet('companies', [
        ['ID', 'Name', 'Username', 'Password', 'Image', 'Enabled'],
      ]);
    }
    
    // Check if username already exists
    const existingData = await getSheetData('companies');
    const existingCompanies = existingData.slice(1); // Skip header row
    
    if (existingCompanies.some((row) => row[2] === username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for the company
    const id = `company_${Date.now()}`;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Upload image if provided
    let imageUrl = null;
    if (image) {
      const fileName = `company_${id}_${Date.now()}.jpg`;
      const uploadResult = await uploadImage(fileName, image, 'companies');
      
      if (uploadResult.success) {
        imageUrl = uploadResult.url;
      }
    }
    
    // Add company to the sheet (enabled by default)
    await appendToSheet('companies', [
      [id, name, username, hashedPassword, imageUrl, 'true'],
    ]);
    
    // Create a sheet for the company
    await createSheet(name);
    
    return NextResponse.json({
      success: true,
      company: {
        id,
        name,
        username,
        image: imageUrl,
        enabled: true,
      },
    });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}

// PUT /api/companies?id={id} - Update a company
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated as admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get company ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const { name, username, password, image, enabled } = await request.json();
    
    // Get companies data
    const data = await getSheetData('companies');
    const companies = data.slice(1); // Skip header row
    
    // Find the company index
    const companyIndex = companies.findIndex((row) => row[0] === id);
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Get the current company data
    const company = companies[companyIndex];
    
    // Prepare updated company data
    const updatedCompany = [...company];
    
    // Update fields if provided
    if (name) updatedCompany[1] = name;
    if (username) updatedCompany[2] = username;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedCompany[3] = hashedPassword;
    }
    
    // Upload new image if provided
    if (image) {
      const fileName = `company_${id}_${Date.now()}.jpg`;
      const uploadResult = await uploadImage(fileName, image, 'companies');
      
      if (uploadResult.success) {
        updatedCompany[4] = uploadResult.url;
      }
    }
    
    // Update enabled status if provided
    if (enabled !== undefined) {
      updatedCompany[5] = enabled ? 'true' : 'false';
    }
    
    // Update the company in the sheet
    // Note: This is a simplified approach. In a real application, you would use
    // the Google Sheets API to update a specific row.
    // For now, we'll delete the row and append the updated data
    await deleteRow('companies', companyIndex + 1); // +1 to account for header row
    await appendToSheet('companies', [updatedCompany]);
    
    return NextResponse.json({
      success: true,
      company: {
        id: updatedCompany[0],
        name: updatedCompany[1],
        username: updatedCompany[2],
        image: updatedCompany[4],
        enabled: updatedCompany[5] === 'true',
      },
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies?id={id} - Delete a company
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated as admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get company ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Get companies data
    const data = await getSheetData('companies');
    const companies = data.slice(1); // Skip header row
    
    // Find the company index
    const companyIndex = companies.findIndex((row) => row[0] === id);
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Get company name for deleting its sheet
    const companyName = companies[companyIndex][1];
    
    // Delete the company row (add 1 to account for header row)
    await deleteRow('companies', companyIndex + 1);
    
    // Note: We don't delete the company's sheet to preserve data
    // In a production environment, you might want to archive it instead
    
    return NextResponse.json({
      success: true,
      message: `Company ${companyName} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendToSheet, createSheet, deleteRow, updateRow } from '@/lib/sheets';
import { uploadImage } from '@/lib/github';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/companies - Get all companies
export async function GET() {
  try {
    // Check if user is authenticated as admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get companies data from Google Sheets
    const data = await getSheetData('companies');
    
    console.log('Raw companies data from sheets:', data);
    
    // Get headers and find the index of the "الحالة" column
    const headers = data[0];
    const statusColumnIndex = headers.findIndex(header => 
      header === 'الحالة' || header === 'Enabled' || header === 'enabled'
    );
    
    console.log('Headers:', headers);
    console.log('Status column index:', statusColumnIndex);
    
    // Skip header row and map to objects
    const companies = data.slice(1).map((row) => {
      console.log(`Company ${row[1]} raw data:`, row);
      
      // Get the status value from the correct column if it exists
      const statusValue = statusColumnIndex !== -1 ? row[statusColumnIndex] : 'true';
      console.log(`Company ${row[1]} status raw value:`, statusValue);
      
      // تحسين طريقة تحويل قيمة الحالة من النص إلى قيمة منطقية
      // اعتبار القيمة 'true' أو 'مفعل' كـ true، وأي قيمة أخرى كـ false
      const isEnabled = statusValue === 'true' || statusValue === 'مفعل';
      console.log(`Company ${row[1]} isEnabled after conversion:`, isEnabled);
      
      return {
        id: row[0],
        name: row[1],
        username: row[2],
        // Don't include password
        image: row[4] || null,
        enabled: isEnabled, // استخدام القيمة المحولة بشكل صحيح
      };
    });
    
    console.log('Processed companies:', companies);
    
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
        ['ID', 'Name', 'Username', 'Password', 'Image'],
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
    
    // Add company to the sheet
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

// PATCH /api/companies - Update company details
export async function PATCH(request: NextRequest) {
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
    const { id, name, username, password, image, enabled } = await request.json();
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    // Get companies data
    const data = await getSheetData('companies');
    
    // Get headers and find the index of the "الحالة" column
    const headers = data[0];
    const statusColumnIndex = headers.findIndex(header => 
      header === 'الحالة' || header === 'Enabled' || header === 'enabled'
    );
    
    console.log('Headers:', headers);
    console.log('Status column index:', statusColumnIndex);
    
    // If status column doesn't exist, add it to headers
    if (statusColumnIndex === -1) {
      headers.push('الحالة');
      // Update the sheet with the new headers
      await updateRow('companies', 0, headers);
      console.log('Added status column to headers:', headers);
    }
    
    const companies = data.slice(1); // Skip header row
    
    // Find the company to update
    const companyIndex = companies.findIndex((row) => row[0] === id);
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Check if username already exists (if changing username)
    if (username && username !== companies[companyIndex][2]) {
      if (companies.some((row) => row[2] === username && row[0] !== id)) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
    }
    
    // Prepare updated company data
    const updatedCompany = [...companies[companyIndex]];
    
    // Update fields if provided
    if (name) updatedCompany[1] = name;
    if (username) updatedCompany[2] = username;
    
    // Hash and update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedCompany[3] = hashedPassword;
    }
    
    // Upload and update image if provided
    if (image) {
      const fileName = `company_${id}_${Date.now()}.jpg`;
      const uploadResult = await uploadImage(fileName, image, 'companies');
      
      if (uploadResult.success) {
        updatedCompany[4] = uploadResult.url;
      }
    }
    
    // Update enabled status if provided
    if (enabled !== undefined) {
      console.log(`Updating company ${id} enabled status to:`, enabled);
      
      // Get the current status column index (it might have been added)
      const currentStatusIndex = headers.findIndex(header => 
        header === 'الحالة' || header === 'Enabled' || header === 'enabled'
      );
      
      // Convert boolean to appropriate string value
      const statusValue = enabled ? 'مفعل' : 'معطل';
      
      // Ensure the company array is long enough
      while (updatedCompany.length <= currentStatusIndex) {
        updatedCompany.push('');
      }
      
      // Update the status value
      updatedCompany[currentStatusIndex] = statusValue;
      
      console.log(`Company ${id} updated status value in sheet:`, updatedCompany[currentStatusIndex]);
    }
    
    // Update the company in the sheet
    const rowToUpdate = companyIndex + 1;
    console.log(`Updating company at index ${companyIndex}, row ${rowToUpdate} in sheet`);
    console.log(`Updated company data to be saved:`, updatedCompany);
    
    // Update the company row directly
    await updateRow('companies', rowToUpdate, updatedCompany);
    
    // Get the current status column index for the response
    const currentStatusIndex = headers.findIndex(header => 
      header === 'الحالة' || header === 'Enabled' || header === 'enabled'
    );
    
    const statusValue = currentStatusIndex !== -1 ? updatedCompany[currentStatusIndex] : 'مفعل';
    const isEnabled = statusValue === 'مفعل' || statusValue === 'true';
    
    const responseCompany = {
      id: updatedCompany[0],
      name: updatedCompany[1],
      username: updatedCompany[2],
      image: updatedCompany[4] || null,
      enabled: isEnabled
    };
    
    console.log(`Response company data:`, responseCompany);
    
    return NextResponse.json({ 
      success: true,
      company: responseCompany
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
} 
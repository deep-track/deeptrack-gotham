import { NextResponse } from 'next/server';

const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'aol.com',
  'protonmail.com',
  'icloud.com',
  'mail.com',
  'zoho.com',
  'yandex.com'
  
];

export async function POST(request: Request) {
  const { email } = await request.json();
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Invalid email format' 
    }, { status: 400 });
  }

  if (FREE_EMAIL_DOMAINS.includes(domain)) {
    return NextResponse.json({ 
      valid: false, 
      message: 'Please use your company email address (personal email providers not allowed)' 
    }, { status: 400 });
  }

  
  return NextResponse.json({ valid: true });
}


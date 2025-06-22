import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Menu Visualizer API is running',
    timestamp: new Date().toISOString()
  });
} 
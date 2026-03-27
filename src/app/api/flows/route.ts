import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/flows - List all flows
export async function GET() {
  try {
    const flows = await db.flow.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json(flows);
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json({ error: 'Failed to fetch flows' }, { status: 500 });
  }
}

// POST /api/flows - Create or update a flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, nodes, edges, variables } = body;
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    let flow;
    
    if (id) {
      // Update existing flow
      flow = await db.flow.update({
        where: { id },
        data: {
          name,
          description: description || '',
          nodes: typeof nodes === 'string' ? nodes : JSON.stringify(nodes || []),
          edges: typeof edges === 'string' ? edges : JSON.stringify(edges || []),
          variables: typeof variables === 'string' ? variables : JSON.stringify(variables || {}),
        },
      });
    } else {
      // Create new flow
      flow = await db.flow.create({
        data: {
          name,
          description: description || '',
          nodes: typeof nodes === 'string' ? nodes : JSON.stringify(nodes || []),
          edges: typeof edges === 'string' ? edges : JSON.stringify(edges || []),
          variables: typeof variables === 'string' ? variables : JSON.stringify(variables || {}),
        },
      });
    }
    
    return NextResponse.json(flow);
  } catch (error) {
    console.error('Error saving flow:', error);
    return NextResponse.json({ error: 'Failed to save flow' }, { status: 500 });
  }
}

// DELETE /api/flows?id=xxx - Delete a flow
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    await db.flow.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flow:', error);
    return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 });
  }
}

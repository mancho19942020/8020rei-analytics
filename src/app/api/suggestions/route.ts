import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENT_EMAIL = 'german@8020rei.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, subject, description, userEmail, userName } = body;

    // Validate required fields
    if (!category || !subject || !description || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Description must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: 'Metrics Hub <onboarding@resend.dev>',
      to: [RECIPIENT_EMAIL],
      subject: `[Metrics Hub Suggestion] ${category}: ${subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
            New Suggestion
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 12px; color: #6b7280; font-weight: 600; width: 100px;">From</td>
              <td style="padding: 8px 12px; color: #111827;">${userName} (${userEmail})</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; color: #6b7280; font-weight: 600;">Category</td>
              <td style="padding: 8px 12px; color: #111827;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; color: #6b7280; font-weight: 600;">Subject</td>
              <td style="padding: 8px 12px; color: #111827;">${subject}</td>
            </tr>
          </table>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="color: #6b7280; font-weight: 600; margin: 0 0 8px 0;">Description</p>
            <p style="color: #111827; margin: 0; white-space: pre-wrap;">${description}</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Sent from Metrics Hub Suggestions
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send suggestion email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Suggestion API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

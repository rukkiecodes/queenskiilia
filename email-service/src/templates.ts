// Email template registry — maps template name to subject + HTML body builder

export interface EmailTemplate {
  subject: string;
  html:    string;
  text:    string;
}

export function renderTemplate(template: string, data: Record<string, unknown>): EmailTemplate {
  switch (template) {
    case 'otp':
      return {
        subject: 'Your QueenSkiilia login code',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#7c3aed">QueenSkiilia</h2>
            <p>Your one-time login code is:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:20px 0">
              ${data.otp}
            </div>
            <p style="color:#666">This code expires in <strong>${data.expiresInMinutes} minutes</strong>.</p>
            <p style="color:#999;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
        text: `Your QueenSkiilia login code is: ${data.otp}\nExpires in ${data.expiresInMinutes} minutes.`,
      };

    case 'project_application':
      return {
        subject: `New application on "${data.projectTitle}"`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#7c3aed">New Application</h2>
            <p><strong>${data.studentName}</strong> has applied to your project <strong>${data.projectTitle}</strong>.</p>
            <p>Log in to review the application.</p>
          </div>
        `,
        text: `${data.studentName} applied to "${data.projectTitle}". Log in to review.`,
      };

    case 'application_accepted':
      return {
        subject: `Your application was accepted!`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#7c3aed">Congratulations!</h2>
            <p>Your application to <strong>${data.projectTitle}</strong> has been accepted.</p>
            <p>The business will fund escrow and you can start working on the project.</p>
          </div>
        `,
        text: `Your application to "${data.projectTitle}" was accepted!`,
      };

    case 'payment_released':
      return {
        subject: 'Your payment has been released',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#7c3aed">Payment Released</h2>
            <p>Your payment of <strong>${data.currency} ${data.amount}</strong> for project <strong>${data.projectTitle}</strong> has been released.</p>
          </div>
        `,
        text: `Payment of ${data.currency} ${data.amount} released for "${data.projectTitle}".`,
      };

    case 'dispute_raised':
      return {
        subject: 'A dispute has been raised on your project',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#dc2626">Dispute Raised</h2>
            <p>A dispute has been raised on project <strong>${data.projectTitle}</strong>.</p>
            <p>Our team will review and reach out within 24-48 hours.</p>
          </div>
        `,
        text: `Dispute raised on "${data.projectTitle}". Our team will review.`,
      };

    case 'welcome':
      return {
        subject: 'Welcome to QueenSkiilia!',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#7c3aed">Welcome to QueenSkiilia!</h2>
            <p>Hi ${data.name || 'there'},</p>
            <p>Your account has been created. Start exploring projects and connecting with talent.</p>
          </div>
        `,
        text: `Welcome to QueenSkiilia, ${data.name || 'there'}!`,
      };

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

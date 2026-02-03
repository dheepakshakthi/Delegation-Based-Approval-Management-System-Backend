const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email function
exports.sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('✉️  Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

// Send approval notification
exports.sendApprovalNotification = async (request, approver) => {
  const subject = `New Approval Request: ${request.title}`;
  const text = `
    You have a new approval request.
    
    Title: ${request.title}
    From: ${request.requester.name}
    Priority: ${request.priority}
    Type: ${request.requestType}
    
    Please log in to the system to review this request.
  `;

  await this.sendEmail({
    to: approver.email,
    subject,
    text
  });
};

// Send delegation notification
exports.sendDelegationNotification = async (delegation, delegator) => {
  const subject = 'Delegation Assignment';
  const text = `
    ${delegator.name} has delegated their approval authority to you.
    
    Period: ${delegation.startDate.toDateString()} to ${delegation.endDate.toDateString()}
    Reason: ${delegation.reason}
    
    You can now approve requests on their behalf during this period.
  `;

  await this.sendEmail({
    to: delegation.delegate.email,
    subject,
    text
  });
};

// Send status change notification
exports.sendStatusChangeNotification = async (request, status, reviewer) => {
  const subject = `Request ${status}: ${request.title}`;
  let text = `
    Your request "${request.title}" has been ${status.toLowerCase()} by ${reviewer.name}.
  `;

  if (status === 'Rejected' && request.rejectionReason) {
    text += `\n\nReason: ${request.rejectionReason}`;
  }

  await this.sendEmail({
    to: request.requester.email,
    subject,
    text
  });
};

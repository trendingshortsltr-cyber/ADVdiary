import { Resend } from 'resend';

// Use a placeholder if API key is not set to avoid crashing
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export const sendEmail = async (to: string, subject: string, html: string) => {
    if (!resend) {
        console.log('Resend API Key missing. Simulating email:', { to, subject });
        return { success: true, simulated: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'CaseTrack <onboarding@resend.dev>', // Default testing domain
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Email error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Email exception:', err);
        return { success: false, error: err };
    }
};

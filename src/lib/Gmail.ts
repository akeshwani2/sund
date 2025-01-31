export class GmailService {
    constructor(private accessToken: string) {}
  
    async getRecentEmails(maxResults = 50, category = "") {
      try {
        const url = category 
          ? `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=${category}`
          : `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;

        const messagesResponse = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
        });

        if (!messagesResponse.ok) throw new Error(`API error: ${await messagesResponse.text()}`);
        const messagesData = await messagesResponse.json();
        
        // Get full content for each message
        const emails = await Promise.all(
          messagesData.messages.map(async (msg: { id: string }) => {
            const messageResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
              {
                headers: {
                  Authorization: `Bearer ${this.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            return messageResponse.json();
          })
        );

        return emails;
      } catch (error) {
        console.error('Gmail API request failed:', error);
        throw error;
      }
    }
  
    async createDraft(to: string, subject: string, body: string) {
      try {
        const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!isValidEmail(to)) {
          throw new Error('Invalid email address format');
        }

        const rawMessage = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=utf-8',
          '',
          body
        ].join('\n');

        const encodedMessage = window.btoa(unescape(encodeURIComponent(rawMessage))).replace(/\+/g, '-').replace(/\//g, '_');

        const response = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: {
                raw: encodedMessage
              }
            })
          }
        );

        if (!response.ok) throw new Error(`Draft creation failed: ${await response.text()}`);
        return await response.json();
      } catch (error) {
        console.error('Draft creation error:', error);
        throw error;
      }
    }
  
    async sendEmail(to: string, subject: string, body: string) {
      try {
        const rawMessage = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=utf-8',
          '',
          body
        ].join('\n');

        const encodedMessage = window.btoa(unescape(encodeURIComponent(rawMessage))).replace(/\+/g, '-').replace(/\//g, '_');

        const response = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              raw: encodedMessage
            })
          }
        );

        if (!response.ok) throw new Error(`Email send failed: ${await response.text()}`);
        return await response.json();
      } catch (error) {
        console.error('Email send error:', error);
        throw error;
      }
    }
  
    // Add more methods as needed
  }
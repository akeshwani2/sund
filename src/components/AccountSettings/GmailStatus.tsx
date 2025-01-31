import { Button } from "@nextui-org/react";
import { GmailService } from "@/lib/Gmail";
import { useSelector } from "react-redux";
import { selectUserDetailsState } from "@/store/authSlice";
import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

const GmailStatus = () => {
  const user = useSelector(selectUserDetailsState);
  const [emails, setEmails] = useState<any[]>([]);

  const testGmailAPI = async () => {
    try {
      const docRef = doc(db, "users", user.uid, "integrations", "gmail");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { accessToken } = docSnap.data();
        const gmail = new GmailService(accessToken);
        const emailResponse = await gmail.getRecentEmails();
        setEmails(emailResponse || []);
        console.log("Recent emails:", emailResponse);
      } else {
        setEmails([]); // Clear emails if connection lost
        console.log("Gmail connection not found");
      }
    } catch (error) {
      console.error("Gmail API test failed:", error);
      setEmails([]); // Clear emails on error
    }
  };

  return (
    <div>
      <Button onClick={testGmailAPI} className="w-full rounded-md">Test Gmail API</Button>
      {emails.length > 0 && (
        <div className="flex flex-col gap-2 text-sm max-w-sm border mt-4 border-gray-600 rounded-md py-4 px-2 text-center justify-center items-center">
          <h4 className="font-semibold">Recent Emails (IDs):</h4>
          {emails.slice(0, 10).map((email) => (
            <div key={email.id}>
              {/* <div>{email.snippet}</div>
              <div>{email.payload.headers.find((h: any) => h.name === 'From')?.value || 'Unknown'}</div> */}
              <div>{email.id}</div>
            </div>
          ))}
          <div className="text-green-500 text-sm">All systems go</div>
        </div>
      )}
    </div>
  );
};

export default GmailStatus;

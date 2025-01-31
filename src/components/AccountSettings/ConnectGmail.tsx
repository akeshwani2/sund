// New component for Gmail connection
import { Button } from "@nextui-org/react";
import { useSelector } from "react-redux";
import { selectUserDetailsState } from "@/store/authSlice";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { GmailService } from "@/lib/Gmail";
import { Mail } from "lucide-react";
const ConnectGmail = () => {
  const user = useSelector(selectUserDetailsState) as {
    uid: string;
    email?: string;
    name?: string;
    profilePic?: string;
  };
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (user?.uid) {
        const docRef = doc(db, 'users', user.uid, 'integrations', 'gmail');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          try {
            const { accessToken } = docSnap.data();
            // Test token validity with a simple API call
            const gmail = new GmailService(accessToken);
            await gmail.getRecentEmails(1); // Try fetching 1 email
            setIsConnected(true);
          } catch (error) {
            console.error('Invalid Gmail token:', error);
            setIsConnected(false);
          }
        } else {
          setIsConnected(false);
        }
      }
    };
    checkConnection();
  }, [user?.uid]);

  const handleConnect = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${window.location.origin}/api/gmail/callback&` +
      `response_type=code&` +
      `scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.modify&` +
      `access_type=offline&` +
      `state=${user.uid}&` +
      `prompt=consent`;
    
    window.location.href = authUrl;
  };

  return (
    <Button 
      onClick={handleConnect}
      color={isConnected ? "success" : "primary"}
      disabled={isConnected}
      className="w-full rounded-md"
    >
      <Mail />
      {isConnected ? "Gmail Connected ✓" : "Connect Gmail"}
    </Button>
  );
};

export default ConnectGmail;
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const LoginButton = () => {
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("✅ Logged in as:", user.displayName, user.email);
      toast({
        title: `Welcome, ${user.displayName || user.email}!`,
        description: "You have successfully signed in.",
      });
    } catch (error) {
      console.error("❌ Login failed:", error);
      toast({
        title: "Login Failed",
        description: "There was an error signing in. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleLogin}
      className="bg-teal-500 hover:bg-teal-400 text-black font-semibold"
    >
      <LogIn className="h-4 w-4 mr-2" />
      Sign in with Google
    </Button>
  );
};

export default LoginButton; 
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { AuthError } from "firebase/auth";

const LoginButton = () => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Try popup first, fallback to redirect if popup fails
      try {
        await signInWithGoogle(true); // true for popup
      } catch (error) {
        // If popup fails (e.g., blocked), try redirect
        const authError = error as AuthError;
        if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/cancelled-popup-request') {
          await signInWithGoogle(false); // false for redirect
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("❌ Login failed:", error);
      toast({
        title: "Login Failed",
        description: "There was an error signing in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      className="bg-teal-500 hover:bg-teal-400 text-black font-semibold"
    >
      <LogIn className="h-4 w-4 mr-2" />
      {isLoading ? "Signing in..." : "Sign in with Google"}
    </Button>
  );
};

export default LoginButton; 
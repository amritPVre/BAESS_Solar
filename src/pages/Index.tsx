
import React from "react";
import SolarCalculator from "@/components/SolarCalculator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Index: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-end mb-4 gap-4">
        {isAuthenticated ? (
          <div className="flex gap-2">
            <span className="text-muted-foreground self-center">Welcome, {user?.name}</span>
            <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
          </div>
        ) : (
          <>
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">Login / Register</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Authentication Required</DialogTitle>
                  <DialogDescription>
                    Please login or register to save your projects and access additional features.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowLoginDialog(false)}>
                    Continue as Guest
                  </Button>
                  <Button onClick={() => {
                    setShowLoginDialog(false);
                    navigate("/auth");
                  }}>
                    Proceed to Login
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
      
      <SolarCalculator />
    </div>
  );
};

export default Index;

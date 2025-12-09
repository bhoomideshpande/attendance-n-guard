import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { authApi, getUser } from "@/lib/api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authApi.login(adminId, password);
      const user = getUser();
      
      if (user?.role !== 'admin') {
        authApi.logout();
        toast.error("Access denied. Admin credentials required.");
        return;
      }
      
      toast.success("Admin login successful!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive via-primary to-secondary p-4">
      <Card className="w-full max-w-md shadow-custom-lg border-2 border-secondary">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-8 h-8 text-secondary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-secondary">Admin Portal</CardTitle>
          <CardDescription>Restricted access for administrators only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminId">Admin ID</Label>
              <Input
                id="adminId"
                type="text"
                placeholder="Enter admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Admin Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-center text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-medium">
            Back to User Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;

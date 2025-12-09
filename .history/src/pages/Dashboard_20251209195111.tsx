import React, { useState, useEffect } from "react";
import { FlagHeader } from "@/components/FlagHeader";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Award, TrendingUp, FileText, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { studentsApi, authApi } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate("/login");
      return;
    }
    
    const loadDashboardData = async () => {
      try {
        const students = await studentsApi.getAll();
        setTotalStudents(students.length);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [navigate]);

  const stats = [
    { title: "Total Students", value: totalStudents.toString(), icon: Users, color: "text-primary" },
    { title: "Today's Attendance", value: "0", icon: TrendingUp, color: "text-accent" },
    { title: "Upcoming Events", value: "3", icon: Calendar, color: "text-secondary" },
    { title: "Certificates Issued", value: "0", icon: Award, color: "text-primary" },
  ];

  const quickActions = [
    { label: "Add Student", icon: UserPlus, action: () => navigate("/students/new"), color: "primary" },
    { label: "View Reports", icon: TrendingUp, action: () => navigate("/reports"), color: "secondary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FlagHeader />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the NCC Attendance Portal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-custom-md hover:shadow-custom-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-custom-md mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={action.action}
                >
                  <action.icon className="w-8 h-8" />
                  <span className="font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-custom-md">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Student admitted", name: "Rahul Kumar", time: "2 hours ago" },
                  { action: "Attendance marked", name: "Company A", time: "4 hours ago" },
                  { action: "Certificate issued", name: "Priya Singh", time: "1 day ago" },
                  { action: "Event created", name: "Annual Parade", time: "2 days ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-custom-md">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Republic Day Parade", date: "26 Jan 2025", location: "Delhi" },
                  { name: "NCC Camp", date: "5 Feb 2025", location: "Dehradun" },
                  { name: "Annual Competition", date: "15 Feb 2025", location: "Mumbai" },
                ].map((event, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <Calendar className="w-5 h-5 text-secondary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.location}</p>
                    </div>
                    <span className="text-xs font-medium text-primary">{event.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

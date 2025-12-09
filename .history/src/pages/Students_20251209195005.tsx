import React, { useState, useEffect } from "react";
import { FlagHeader } from "@/components/FlagHeader";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { studentsApi, authApi } from "@/lib/api";
import { toast } from "sonner";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  instituteCode: string;
  batch: string;
  phone: string;
}

const Students = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if authenticated
    if (!authApi.isAuthenticated()) {
      navigate("/login");
      return;
    }
    
    loadStudents();
  }, [navigate]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const data = await studentsApi.getAll();
      setStudents(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load students");
      if (error.message === "Missing token" || error.message === "Invalid token") {
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(student.id).includes(searchTerm)
  );

  const handleDelete = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    try {
      await studentsApi.delete(studentId);
      toast.success("Student deleted successfully");
      setStudents(students.filter(s => s.id !== studentId));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete student");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FlagHeader />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Students</h1>
            <p className="text-muted-foreground">Manage NCC student records</p>
          </div>
          <Button onClick={() => navigate("/students/new")} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add New Student
          </Button>
        </div>

        <Card className="shadow-custom-md mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-custom-md">
          <CardHeader>
            <CardTitle>All Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Institute</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Batch</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No students found. Add your first student!
                      </td>
                    </tr>
                  ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm">{student.id}</td>
                      <td className="py-3 px-4 font-medium">{student.firstName} {student.lastName}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{student.instituteCode}</td>
                      <td className="py-3 px-4 text-sm">{student.batch}</td>
                      <td className="py-3 px-4 text-sm">{student.phone}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/students/${student.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Students;

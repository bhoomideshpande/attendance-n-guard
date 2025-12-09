import React, { useState, useEffect } from "react";
import { FlagHeader } from "@/components/FlagHeader";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, Building, Calendar, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { studentsApi, attendanceApi, authApi } from "@/lib/api";
import { toast } from "sonner";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  instituteCode: string;
  batch: string;
  photo?: string;
  dob?: string;
  gender?: string;
  address?: string;
  parentName?: string;
  createdAt?: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
}

const StudentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate("/login");
      return;
    }
    
    if (id) {
      loadStudentData();
    }
  }, [id, navigate]);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      const studentData = await studentsApi.getById(id!);
      setStudent(studentData);
      
      // Load attendance for this student
      const allAttendance = await attendanceApi.getAll();
      const studentAttendance = allAttendance.filter(
        (a: any) => a.studentId === parseInt(id!)
      );
      setAttendance(studentAttendance);
    } catch (error: any) {
      toast.error(error.message || "Failed to load student");
      navigate("/students");
    } finally {
      setIsLoading(false);
    }
  };

  const presentCount = attendance.filter(a => a.status === "present").length;
  const absentCount = attendance.filter(a => a.status === "absent").length;
  const attendancePercentage = attendance.length > 0 
    ? Math.round((presentCount / attendance.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <FlagHeader />
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <FlagHeader />
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Student not found</p>
            <Button className="mt-4" onClick={() => navigate("/students")}>
              Back to Students
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FlagHeader />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate("/students")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Profile Card */}
          <Card className="shadow-custom-md lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {student.photo ? (
                  <img 
                    src={`http://localhost:4000${student.photo}`}
                    alt={`${student.firstName} ${student.lastName}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                    <span className="text-primary font-bold text-4xl">
                      {student.firstName[0]}{student.lastName[0]}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-bold mt-4">
                  {student.firstName} {student.lastName}
                </h2>
                <Badge className="mt-2">ID: {student.id}</Badge>
                <p className="text-muted-foreground mt-2">{student.instituteCode}</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{student.phone || "Not provided"}</span>
                </div>
                {student.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{student.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>{student.instituteCode || "Not assigned"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Batch: {student.batch}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Stats & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Overview */}
            <Card className="shadow-custom-md">
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{presentCount}</p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{absentCount}</p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{attendancePercentage}%</p>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance History */}
            <Card className="shadow-custom-md">
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No attendance records yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {attendance
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => (
                        <div 
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <span className="font-medium">
                            {new Date(record.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <Badge variant={record.status === "present" ? "default" : "destructive"}>
                            {record.status === "present" ? "Present" : "Absent"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDetail;

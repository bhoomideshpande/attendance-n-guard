import React, { useState, useEffect } from "react";
import { FlagHeader } from "@/components/FlagHeader";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, X, Loader2, Users, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { studentsApi, attendanceApi, authApi } from "@/lib/api";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  instituteCode: string;
  batch: string;
  phone: string;
}

interface AttendanceRecord {
  studentId: number;
  status: "present" | "absent";
}

const Attendance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<number, "present" | "absent">>(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadData();
  }, [navigate, selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load students
      const studentsData = await studentsApi.getAll();
      setStudents(studentsData);

      // Load existing attendance for selected date
      const attendanceData = await attendanceApi.getByDate(selectedDate);
      setExistingAttendance(attendanceData);

      // Initialize attendance map with existing records
      const attendanceMap = new Map<number, "present" | "absent">();
      attendanceData.forEach((record: any) => {
        attendanceMap.set(record.studentId, record.status);
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAttendance = (studentId: number) => {
    const newAttendance = new Map(attendance);
    const currentStatus = newAttendance.get(studentId);
    
    if (currentStatus === "present") {
      newAttendance.set(studentId, "absent");
    } else {
      newAttendance.set(studentId, "present");
    }
    
    setAttendance(newAttendance);
  };

  const markAllPresent = () => {
    const newAttendance = new Map<number, "present" | "absent">();
    students.forEach(student => {
      newAttendance.set(student.id, "present");
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance = new Map<number, "present" | "absent">();
    students.forEach(student => {
      newAttendance.set(student.id, "absent");
    });
    setAttendance(newAttendance);
  };

  const saveAttendance = async () => {
    if (attendance.size === 0) {
      toast.error("Please mark attendance for at least one student");
      return;
    }

    setIsSaving(true);
    try {
      const records: AttendanceRecord[] = [];
      attendance.forEach((status, studentId) => {
        records.push({ studentId, status });
      });

      await attendanceApi.markBulk(selectedDate, records);
      toast.success(`Attendance saved for ${records.length} students`);
      
      // Reload to get updated data
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Array.from(attendance.values()).filter(s => s === "present").length;
  const absentCount = Array.from(attendance.values()).filter(s => s === "absent").length;
  const unmarkedCount = students.length - attendance.size;

  return (
    <div className="min-h-screen bg-background">
      <FlagHeader />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mark Attendance</h1>
            <p className="text-muted-foreground">Record daily attendance for students</p>
          </div>
        </div>

        {/* Date Selection & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-custom-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">Select Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-custom-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-custom-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-custom-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-custom-md mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={markAllPresent} disabled={students.length === 0}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark All Present
                </Button>
                <Button variant="outline" onClick={markAllAbsent} disabled={students.length === 0}>
                  <X className="w-4 h-4 mr-2" />
                  Mark All Absent
                </Button>
              </div>
              <Button onClick={saveAttendance} disabled={isSaving || attendance.size === 0}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Attendance
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card className="shadow-custom-md">
          <CardHeader>
            <CardTitle>Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No students found. Add students first!</p>
                <Button className="mt-4" onClick={() => navigate("/students/new")}>
                  Add Student
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => {
                  const status = attendance.get(student.id);
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                        status === "present"
                          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                          : status === "absent"
                          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                          : "bg-muted/30 border-border"
                      }`}
                      onClick={() => toggleAttendance(student.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.instituteCode} • {student.batch}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {status ? (
                          <Badge variant={status === "present" ? "default" : "destructive"}>
                            {status === "present" ? "Present" : "Absent"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Marked</Badge>
                        )}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={status === "present" ? "default" : "outline"}
                            className={status === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newAttendance = new Map(attendance);
                              newAttendance.set(student.id, "present");
                              setAttendance(newAttendance);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "absent" ? "default" : "outline"}
                            className={status === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newAttendance = new Map(attendance);
                              newAttendance.set(student.id, "absent");
                              setAttendance(newAttendance);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Attendance;

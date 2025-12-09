import React, { useState, useEffect } from "react";
import { FlagHeader } from "@/components/FlagHeader";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { studentsApi, authApi } from "@/lib/api";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  instituteCode: string;
  batch: string;
  phone: string;
  email: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [instituteFilter, setInstituteFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate("/login");
      return;
    }
    
    const loadStudents = async () => {
      try {
        const data = await studentsApi.getAll();
        setStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStudents();
  }, [navigate]);

  useEffect(() => {
    // Apply filters
    let filtered = students;
    
    if (instituteFilter !== "all") {
      filtered = filtered.filter(s => s.instituteCode === instituteFilter);
    }
    
    if (batchFilter !== "all") {
      filtered = filtered.filter(s => s.batch === batchFilter);
    }
    
    setFilteredStudents(filtered);
  }, [instituteFilter, batchFilter, students]);

  const institutes = Array.from(new Set(students.map(s => s.instituteCode))).filter(Boolean);
  const batches = Array.from(new Set(students.map(s => s.batch))).filter(Boolean);

  const downloadCSV = () => {
    const headers = ["ID", "Name", "Institute", "Batch", "Phone", "Email"];
    const rows = filteredStudents.map(s => [
      s.id,
      `${s.firstName} ${s.lastName}`,
      s.instituteCode,
      s.batch,
      s.phone,
      s.email
    ]);
    
    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ncc_students_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <FlagHeader />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
            <p className="text-muted-foreground">View and export student data</p>
          </div>
          <Button onClick={downloadCSV} className="gap-2" disabled={filteredStudents.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <Card className="shadow-custom-md mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Institute</label>
                <Select value={instituteFilter} onValueChange={setInstituteFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Institutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Institutes</SelectItem>
                    {institutes.map(inst => (
                      <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch</label>
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map(batch => (
                      <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-custom-md">
          <CardHeader>
            <CardTitle>Student Records ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No student records found. Add students to see reports.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Institute</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">{student.id}</TableCell>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.institute}</TableCell>
                      <TableCell>{student.batch}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;

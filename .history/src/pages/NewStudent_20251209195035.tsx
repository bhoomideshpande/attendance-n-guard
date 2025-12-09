import React, { useState, useEffect } from "react";
import { FlagHeader } from "@/components/FlagHeader";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Upload, Check, Loader2 } from "lucide-react";
import { studentsApi, authApi } from "@/lib/api";

const NewStudent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    nationality: "Indian",
    address: "",
    phone: "",
    email: "",
    parentName: "",
    instituteCode: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file));
      setPhotos([...photos, ...newPhotos].slice(0, 3));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const year = new Date().getFullYear();
      const newStudent = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        nationality: formData.nationality,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        parentName: formData.parentName,
        instituteCode: formData.instituteCode,
        batch: year.toString(),
      };
      
      const result = await studentsApi.create(newStudent);
      toast.success(`Student admitted successfully! ID: ${result.id}`);
      navigate("/students");
    } catch (error: any) {
      toast.error(error.message || "Failed to create student");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FlagHeader />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">New Student Admission</h1>
            <p className="text-muted-foreground">Step {step} of 3</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? "bg-primary" : "bg-muted"
                } transition-colors`}
              />
            ))}
          </div>

          <Card className="shadow-custom-md">
            <CardHeader>
              <CardTitle>
                {step === 1 && "Basic Information"}
                {step === 2 && "Upload Photos"}
                {step === 3 && "Review & Submit"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parent/Guardian Name</Label>
                      <Input
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institute Code</Label>
                      <Input
                        value={formData.instituteCode}
                        onChange={(e) => setFormData({ ...formData, instituteCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload 3 clear photos of the student (front-facing)
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                    {[...Array(3 - photos.length)].map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground"
                      >
                        Photo {photos.length + index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-muted rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Student Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {formData.firstName} {formData.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{formData.dob}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{formData.gender}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{formData.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Uploaded Photos ({photos.length})</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button onClick={handleNext} className="ml-auto">
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="ml-auto">
                    Submit & Generate ID
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewStudent;

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Save,
  Camera,
  Settings,
  Bell,
  Zap,
  Clock,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

export function StudentProfile({ student, onBack, accessToken, projectId, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    name: student?.name || "",
    email: student?.email || "",
    username: student?.username || "",
    rollNumber: student?.rollNumber || "",
    batch: student?.batch || "",
    class: student?.class || "",
    phone: student?.phone || "",
    department: student?.department || "",
    semester: student?.semester || "",
    specialization: student?.specialization || "",
    qualification: student?.qualification || "",
    joinDate: student?.joinDate || "January 2024",
    address: student?.address || "",
    bio: student?.bio || "",
  });

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/make-server-2fad19e1/student/profile/update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        },
      );

      if (response.ok) {
        toast.success("Profile updated successfully!");
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Back Button */}
      <div className="flex items-center gap-3 mb-2">
        <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 text-slate-600">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header Banner - Matches Settings style */}
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-white/20 rounded-lg">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-medium">Settings</h1>
            <p className="text-white/90 text-sm mt-1">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Tabs list simulation matching Settings style */}
      <div className="flex bg-gray-100/50 p-1 rounded-xl w-fit mb-6">
        <button className="px-6 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-indigo-600 flex items-center gap-2">
          <User className="w-4 h-4" />
          Profile
        </button>
        <button className="px-6 py-2 text-sm font-medium text-gray-500 flex items-center gap-2 hover:text-gray-700">
          <Bell className="w-4 h-4" />
          Notifications
        </button>
        <button className="px-6 py-2 text-sm font-medium text-gray-500 flex items-center gap-2 hover:text-gray-700">
          <Zap className="w-4 h-4" />
          Preferences
        </button>
        <button className="px-6 py-2 text-sm font-medium text-gray-500 flex items-center gap-2 hover:text-gray-700">
          <Clock className="w-4 h-4" />
          Security
        </button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal and professional details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-2xl">
                  {profileData.name?.slice(0, 2).toUpperCase() || "ST"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg border-2 border-white"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{profileData.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{profileData.department || "General Dentistry"}</p>
              <Button variant="outline" size="sm" className="h-8">Change Photo</Button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="pl-10 h-11 bg-gray-100 text-muted-foreground border-gray-200 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-semibold text-gray-700">Department</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. Oral Pathology"
                  />
                </div>
              </div>

              {/* Specialization */}
              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-sm font-semibold text-gray-700">Specialization</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="specialization"
                    value={profileData.specialization || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. Oral Medicine and Radiology"
                  />
                </div>
              </div>

              {/* Qualification */}
              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-sm font-semibold text-gray-700">Qualification</Label>
                <Input
                  id="qualification"
                  value={profileData.qualification || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, qualification: e.target.value }))}
                  className="h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. BDS, MDS"
                />
              </div>

              {/* Academic Year */}
              <div className="space-y-2">
                <Label htmlFor="batch" className="text-sm font-semibold text-gray-700">Academic Year / Batch</Label>
                <Input
                  id="batch"
                  value={profileData.batch || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, batch: e.target.value }))}
                  className="h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. 2024 Batch"
                />
              </div>

              {/* Join Date */}
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="text-sm font-semibold text-gray-700">Join Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="joinDate"
                    value={profileData.joinDate || "January 2024"}
                    onChange={(e) => setProfileData(prev => ({ ...prev, joinDate: e.target.value }))}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={profileData.address || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all"
                  placeholder="Enter your campus address"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio || ""}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="bg-gray-50/50 border-gray-200 focus:ring-indigo-500 transition-all resize-none"
                placeholder="Passionate about dental education and clinical excellence..."
              />
            </div>

            <div className="flex pt-4">
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg px-10 h-11 hover:scale-[1.02] transition-transform active:scale-[0.98]"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

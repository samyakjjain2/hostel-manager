import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { HostelsList } from '../pages/hostels/HostelsList';
import { RoomsList } from '../pages/rooms/RoomsList';
import { StudentsList } from '../pages/students/StudentsList';
import { StudentProfile } from '../pages/students/StudentProfile';
import { RoomAllocation } from '../pages/allocation/RoomAllocation';
import { FeesList } from '../pages/fees/FeesList';
import { ComplaintsList } from '../pages/complaints/ComplaintsList';
import { VisitorsList } from '../pages/visitors/VisitorsList';
import { StaffList } from '../pages/staff/StaffList';
import { NoticesList } from '../pages/notices/NoticesList';
import { Reports } from '../pages/reports/Reports';
import { Profile } from '../pages/profile/Profile';
import { UniversalSearch } from '../pages/search/UniversalSearch';
import { NotFound } from '../pages/errors/ErrorPages';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth page */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard operations under Master Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="hostels" element={<HostelsList />} />
          <Route path="rooms" element={<RoomsList />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="allocation" element={<RoomAllocation />} />
          <Route path="fees" element={<FeesList />} />
          <Route path="complaints" element={<ComplaintsList />} />
          <Route path="visitors" element={<VisitorsList />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="notices" element={<NoticesList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="search" element={<UniversalSearch />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
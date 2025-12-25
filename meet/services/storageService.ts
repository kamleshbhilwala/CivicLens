import { ComplaintData, ComplaintStatus } from "../types";

const STORAGE_KEY = 'civic_lens_complaints';

export const saveComplaint = (complaint: ComplaintData) => {
  try {
    const existing = getComplaints();
    // Remove existing if overwriting (based on ID) to avoid duplicates during editing
    const filtered = existing.filter(c => c.id !== complaint.id);
    const updated = [complaint, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save to local storage", e);
  }
};

export const getComplaints = (): ComplaintData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read from local storage", e);
    return [];
  }
};

export const getComplaintById = (id: string): ComplaintData | undefined => {
  const complaints = getComplaints();
  return complaints.find(c => c.id === id);
};

export const updateComplaintStatus = (id: string, status: ComplaintStatus) => {
  try {
    const complaints = getComplaints();
    const updated = complaints.map(c => 
      c.id === id ? { ...c, status } : c
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update status", e);
  }
};
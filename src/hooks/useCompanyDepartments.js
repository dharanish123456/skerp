import { useState, useMemo, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export const useCompanyDepartments = (initialCompanyId = '', initialDepartmentId = '') => {
  const [companies, setCompanies] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartmentId);

  // Fetch companies and departments from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, deptRes] = await Promise.all([
          fetch(`${API_BASE_URL}/companies`),
          fetch(`${API_BASE_URL}/departments`)
        ]);
        
        if (compRes.ok && deptRes.ok) {
          const compData = await compRes.json();
          const deptData = await deptRes.json();
          
          setCompanies(compData.filter(c => c.status === 'Active'));
          setAllDepartments(deptData.filter(d => d.status === 'Active'));
        }
      } catch (error) {
        console.error('Error fetching company/department data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Sync state if initial props change (e.g., draft loading)
  useEffect(() => {
    setSelectedCompanyId(initialCompanyId);
  }, [initialCompanyId]);

  useEffect(() => {
    setSelectedDepartmentId(initialDepartmentId);
  }, [initialDepartmentId]);

  // Filter departments based on selected company
  const departments = useMemo(() => {
    if (!selectedCompanyId) return [];
    return allDepartments.filter(
      d => (d.company?.id === Number(selectedCompanyId) || d.companyId === Number(selectedCompanyId))
    );
  }, [selectedCompanyId, allDepartments]);

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === Number(selectedCompanyId)) || null;
  }, [selectedCompanyId, companies]);

  const selectedDepartment = useMemo(() => {
    return allDepartments.find(d => d.id === Number(selectedDepartmentId)) || null;
  }, [selectedDepartmentId, allDepartments]);

  const handleCompanyChange = (companyId) => {
    setSelectedCompanyId(companyId);
    setSelectedDepartmentId(''); // Reset department when company changes
  };

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartmentId(departmentId);
  };

  return {
    companies,
    departments,
    selectedCompanyId,
    selectedDepartmentId,
    selectedCompany,
    selectedDepartment,
    setSelectedCompanyId,
    setSelectedDepartmentId,
    handleCompanyChange,
    handleDepartmentChange,
  };
};

import { useState, useEffect } from 'react'
import Sidebar from '../sidebar/Sidebar'
import TopBar from '../topbar/TopBar'
import EmployeeList from '../../pages/EmployeeList'
import AddEmployee from '../../pages/AddEmployee'
import Company from '../../pages/Company'
import Department from '../../pages/Department'
import Expenses from '../../pages/Expenses'
import EmployeeAdvance from '../../pages/EmployeeAdvance'

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState("employee-list")
  const [editingEmployee, setEditingEmployee] = useState(null)
  const handleToggle = () => setIsCollapsed(p => !p)
  const handleMobileSidebarToggle = () => setIsMobileSidebarOpen(p => !p)
  const handleMobileSidebarClose = () => setIsMobileSidebarOpen(false)

  useEffect(() => {
    if (currentPage === 'expenses') {
      setCurrentPage('expenses-daily');
    }
  }, [currentPage]);

  const getPageDetails = () => {
    switch (currentPage) {
      case 'employee-list':
        return {
          title: 'Employee List',
          breadcrumb: 'Home / HR Management / Employee List',
        }
      case 'add-employee':
        return {
          title: 'Add Employee',
          breadcrumb: 'Home / HR Management / Add Employee',
        }
      case 'dashboard-overview':
        return {
          title: 'Dashboard Overview',
          breadcrumb: 'Home / Dashboard / Overview',
        }
      case 'dashboard-analytics':
        return {
          title: 'Dashboard Analytics',
          breadcrumb: 'Home / Dashboard / Analytics',
        }
      case 'departments':
        return {
          title: 'Departments',
          breadcrumb: 'Home / HR Management / Departments',
        }
      case 'company':
        return {
          title: 'Company',
          breadcrumb: 'Home / HR Management / Company',
        }
      case 'expenses':
      case 'expenses-daily':
        return {
          title: 'Daily Expense Tracker',
          breadcrumb: 'Home / Expenses / Daily Expenses',
        }
      case 'employee-advance':
        return {
          title: 'Employee Advance Tracker',
          breadcrumb: 'Home / Expenses / Employee Advance',
        }
      default:
        return {
          title: 'Dashboard',
          breadcrumb: 'Home / Dashboard',
        }
    }
  }

  const { title, breadcrumb } = getPageDetails()

  return (
    <>
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
        onToggle={handleToggle}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <TopBar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        onMobileToggle={handleMobileSidebarToggle}
        pageTitle={title}
        breadcrumb={breadcrumb}
      />
      <main
        id="dashboard-main"
        className={`dashboard-main ${isCollapsed ? 'active' : ''}`}
        style={{ padding: '1rem' }}
      >
        {currentPage === 'employee-list' && (
          <EmployeeList
            onAddClick={() => {
              setEditingEmployee(null);
              setCurrentPage('add-employee');
            }}
            onEditClick={(emp) => {
              setEditingEmployee(emp);
              setCurrentPage('add-employee');
            }}
          />
        )}
        {currentPage === 'add-employee' && (
          <AddEmployee
            employee={editingEmployee}
            onCancel={() => {
              setEditingEmployee(null);
              setCurrentPage('employee-list');
            }}
            onSuccess={() => {
              setEditingEmployee(null);
              setCurrentPage('employee-list');
            }}
          />
        )}
        {currentPage === 'company' && (
          <Company />
        )}
        {currentPage === 'departments' && (
          <Department />
        )}
        {(currentPage === 'expenses' || currentPage === 'expenses-daily') && (
          <Expenses />
        )}
        {currentPage === 'employee-advance' && (
          <EmployeeAdvance />
        )}
        {currentPage !== 'employee-list' &&
         currentPage !== 'add-employee' &&
         currentPage !== 'company' &&
         currentPage !== 'departments' &&
         currentPage !== 'expenses' &&
         currentPage !== 'expenses-daily' &&
         currentPage !== 'employee-advance' && (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '1.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#1e293b', margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{title}</h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.875rem' }}>This page is currently under development.</p>
          </div>
        )}
      </main>
    </>
  )
}

export default Layout

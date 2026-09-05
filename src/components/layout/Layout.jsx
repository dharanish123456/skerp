import { useState, useEffect } from 'react'
import Sidebar from '../sidebar/Sidebar'
import TopBar from '../topbar/TopBar'
import EmployeeList from '../../pages/EmployeeList'
import AddEmployee from '../../pages/AddEmployee'
import EmployeeView from '../../pages/EmployeeView'
import MyProfile from '../../pages/MyProfile'
import Company from '../../pages/Company'
import Department from '../../pages/Department'
import Expenses from '../../pages/Expenses'
import EmployeeAdvance from '../../pages/EmployeeAdvance'
import EmployeeAdvanceRequest from '../../pages/EmployeeAdvanceRequest'
import Attendance from '../../pages/Attendance'
import MyAttendance from '../../pages/MyAttendance'
import RoleManagement from '../../pages/RoleManagement'
import RolePermissionEditor from '../../pages/RolePermissionEditor'
import { useAuth } from '../../context/AuthContext'


const Layout = () => {
  const { hasPermission, user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState("employee-list")
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [permissionEditorDirty, setPermissionEditorDirty] = useState(false)
  const handleToggle = () => setIsCollapsed(p => !p)
  const handleMobileSidebarToggle = () => setIsMobileSidebarOpen(p => !p)
  const handleMobileSidebarClose = () => setIsMobileSidebarOpen(false)
  const handlePageChange = (page) => {
    if (currentPage === 'role-permission-editor' && permissionEditorDirty &&
        !window.confirm('You have unsaved permission changes. Leave this page?')) {
      return
    }
    if (page !== 'role-permission-editor') {
      setSelectedRole(null)
      setPermissionEditorDirty(false)
    }
    if (page !== 'view-employee') {
      setSelectedEmployee(null)
    }
    setCurrentPage(page === 'expenses' ? 'expenses-daily' : page)
  }

  const pagePermissions = {
    'dashboard-overview': 'VIEW_DASHBOARD',
    'dashboard-analytics': 'VIEW_DASHBOARD',
    'employee-list': 'VIEW_EMPLOYEES',
    'view-employee': 'VIEW_EMPLOYEES',
    company: 'VIEW_COMPANIES',
    departments: 'VIEW_DEPARTMENTS',
    'expenses-daily': 'VIEW_EXPENSES',
    expenses: 'VIEW_EXPENSES',
    'employee-advance': 'VIEW_ADVANCES',
    'roles-permissions': 'VIEW_ROLES',
    'role-permission-editor': 'EDIT_ROLES',
    'my-advances': 'VIEW_OWN_ADVANCES',
    attendance: 'VIEW_ATTENDANCE',
    'my-attendance': 'VIEW_OWN_ATTENDANCE',
  }

  const requiredPermission = currentPage === 'add-employee'
    ? (editingEmployee?.id ? 'EDIT_EMPLOYEES' : 'CREATE_EMPLOYEES')
    : pagePermissions[currentPage]
  const canAccessCurrentPage = !requiredPermission || hasPermission(requiredPermission)

  useEffect(() => {
    if (!user || canAccessCurrentPage) return;
    const firstAllowedPage = [
      ['dashboard-overview', 'VIEW_DASHBOARD'],
      ['employee-list', 'VIEW_EMPLOYEES'],
      ['company', 'VIEW_COMPANIES'],
      ['departments', 'VIEW_DEPARTMENTS'],
      ['expenses-daily', 'VIEW_EXPENSES'],
      ['employee-advance', 'VIEW_ADVANCES'],
      ['attendance', 'VIEW_ATTENDANCE'],
      ['roles-permissions', 'VIEW_ROLES'],
      ['my-advances', 'VIEW_OWN_ADVANCES'],
      ...(user?.employeeId ? [['my-attendance', 'VIEW_OWN_ATTENDANCE']] : []),
    ].find(([, permission]) => hasPermission(permission))?.[0];
    if (firstAllowedPage) {
      const redirectTimer = window.setTimeout(() => {
        setEditingEmployee(null);
        setSelectedEmployee(null);
        setSelectedRole(null);
        setCurrentPage(firstAllowedPage);
      }, 0);
      return () => window.clearTimeout(redirectTimer);
    }
  }, [user, currentPage, canAccessCurrentPage, editingEmployee, hasPermission]);

  const getPageDetails = () => {
    switch (currentPage) {
      case 'employee-list':
        return {
          title: 'Employee List',
          breadcrumb: 'Home / HR Management / Employee List',
        }
      case 'add-employee':
        return {
          title: editingEmployee?.id ? 'Edit Employee' : 'Add Employee',
          breadcrumb: `Home / HR Management / ${editingEmployee?.id ? 'Edit Employee' : 'Add Employee'}`,
        }
      case 'view-employee':
        return {
          title: 'Employee Profile',
          breadcrumb: `Home / HR Management / Employee List / ${selectedEmployee?.name || 'Employee'}`,
        }
      case 'my-profile':
        return {
          title: 'My Profile',
          breadcrumb: 'Home / Account / My Profile',
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
      case 'my-advances':
        return {
          title: 'My Advances',
          breadcrumb: 'Home / Self Service / My Advances',
        }
      case 'attendance':
        return {
          title: 'Attendance',
          breadcrumb: 'Home / HR Management / Attendance',
        }
      case 'my-attendance':
        return {
          title: 'My Attendance',
          breadcrumb: 'Home / Self Service / My Attendance',
        }
      case 'roles-permissions':
        return {
          title: 'Roles & Permissions',
          breadcrumb: 'Home / Administration / Roles & Permissions',
        }
      case 'role-permission-editor':
        return {
          title: 'Role Permissions',
          breadcrumb: `Home / Administration / Roles & Permissions / ${selectedRole?.name || 'Role'}`,
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
        onPageChange={handlePageChange}
      />
      <TopBar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        onMobileToggle={handleMobileSidebarToggle}
        onProfileClick={() => {
          setEditingEmployee(null)
          setSelectedEmployee(null)
          setCurrentPage('my-profile')
        }}
        pageTitle={title}
        breadcrumb={breadcrumb}
      />
      <main
        id="dashboard-main"
        className={`dashboard-main ${isCollapsed ? 'active' : ''}`}
        style={{ padding: '1rem' }}
      >
        {canAccessCurrentPage && currentPage === 'employee-list' && (
          <EmployeeList
            onAddClick={() => {
              if (!hasPermission('CREATE_EMPLOYEES')) return;
              setEditingEmployee(null);
              setCurrentPage('add-employee');
            }}
            onEditClick={(emp) => {
              if (!hasPermission('EDIT_EMPLOYEES')) return;
              setEditingEmployee(emp);
              setSelectedEmployee(null);
              setCurrentPage('add-employee');
            }}
            onViewClick={(emp) => {
              setSelectedEmployee(emp);
              setCurrentPage('view-employee');
            }}
          />
        )}
        {canAccessCurrentPage && currentPage === 'view-employee' && selectedEmployee && (
          <EmployeeView
            employee={selectedEmployee}
            onBack={() => {
              setSelectedEmployee(null);
              setCurrentPage('employee-list');
            }}
            onEdit={hasPermission('EDIT_EMPLOYEES') ? (emp) => {
              setEditingEmployee(emp);
              setSelectedEmployee(null);
              setCurrentPage('add-employee');
            } : null}
          />
        )}
        {canAccessCurrentPage && currentPage === 'my-profile' && (
          <MyProfile />
        )}
        {canAccessCurrentPage && currentPage === 'add-employee' && (
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
        {canAccessCurrentPage && currentPage === 'company' && (
          <Company />
        )}
        {canAccessCurrentPage && currentPage === 'departments' && (
          <Department />
        )}
        {canAccessCurrentPage && (currentPage === 'expenses' || currentPage === 'expenses-daily') && (
          <Expenses />
        )}
        {canAccessCurrentPage && currentPage === 'employee-advance' && (
          <EmployeeAdvance />
        )}
        {canAccessCurrentPage && currentPage === 'my-advances' && (
          <EmployeeAdvanceRequest />
        )}
        {canAccessCurrentPage && currentPage === 'attendance' && (
          <Attendance />
        )}
        {canAccessCurrentPage && currentPage === 'my-attendance' && user?.employeeId && (
          <MyAttendance />
        )}
        {canAccessCurrentPage && currentPage === 'roles-permissions' && (
          <RoleManagement
            onManagePermissions={(role) => {
              setSelectedRole(role);
              setCurrentPage('role-permission-editor');
            }}
          />
        )}
        {canAccessCurrentPage && currentPage === 'role-permission-editor' && selectedRole && (
          <RolePermissionEditor
            role={selectedRole}
            onBack={() => {
              setSelectedRole(null);
              setCurrentPage('roles-permissions');
            }}
            onSaved={setSelectedRole}
            onDirtyChange={setPermissionEditorDirty}
          />
        )}
        {!canAccessCurrentPage && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#b91c1c' }}>
            You do not have permission to access this page.
          </div>
        )}
        {currentPage !== 'employee-list' &&
         currentPage !== 'add-employee' &&
         currentPage !== 'view-employee' &&
         currentPage !== 'my-profile' &&
         currentPage !== 'company' &&
         currentPage !== 'departments' &&
         currentPage !== 'expenses' &&
         currentPage !== 'expenses-daily' &&
         currentPage !== 'employee-advance' &&
         currentPage !== 'my-advances' &&
         currentPage !== 'attendance' &&
         currentPage !== 'my-attendance' &&
         currentPage !== 'roles-permissions' &&
         currentPage !== 'role-permission-editor' &&
         canAccessCurrentPage && (
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

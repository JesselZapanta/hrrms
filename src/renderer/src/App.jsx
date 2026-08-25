import { useEffect, useState } from 'react'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import EmployeeFolder from './pages/EmployeeFolder.jsx'
import Users from './pages/Users.jsx'
import Categories from './pages/Categories.jsx'
import Offices from './pages/Offices.jsx'
import SalaryGrades from './pages/SalaryGrades.jsx'
import Profile from './pages/Profile.jsx'

const SESSION_KEY = 'hrrms.session'

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [view, setView] = useState('dashboard')
  const [categories, setCategories] = useState([])
  const [folderEmployee, setFolderEmployee] = useState(null)

  const loadCategories = async () => {
    const res = await window.api.categories.listAll()
    if (res.ok) setCategories(res.data)
  }

  useEffect(() => {
    if (user) loadCategories()
  }, [user])

  if (!user) {
    return (
      <Login
        onLogin={(u) => {
          localStorage.setItem(SESSION_KEY, JSON.stringify(u))
          setUser(u)
          setView('dashboard')
        }}
      />
    )
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    setView('dashboard')
    setFolderEmployee(null)
  }

  const openFolder = (emp) => {
    setFolderEmployee(emp)
    setView('folder')
  }

  const handleUserChange = (u) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u))
    setUser(u)
  }

  return (
    <Layout user={user} view={view} onNavigate={setView} onLogout={logout}>
      {view === 'dashboard' && <Dashboard user={user} onNavigate={setView} />}
      {view === 'profile' && <Profile currentUser={user} onUserChange={handleUserChange} />}
      {view === 'employees' && <Employees onOpenFolder={openFolder} currentUser={user} />}
      {view === 'folder' && folderEmployee && (
        <EmployeeFolder
          employee={folderEmployee}
          categories={categories}
          onBack={() => setView('employees')}
        />
      )}
      {view === 'users' && user.role === 'admin' && <Users currentUser={user} />}
      {view === 'offices' && user.role === 'admin' && <Offices />}
      {view === 'salaryGrades' && user.role === 'admin' && <SalaryGrades />}
      {view === 'categories' && <Categories currentUser={user} />}
    </Layout>
  )
}
